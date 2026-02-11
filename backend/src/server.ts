import Fastify from "fastify";
import dotenv from "dotenv";
import prisma from "./prisma";
import oauthPlugin from "@fastify/oauth2";
import axios from "axios";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import websocket from "@fastify/websocket";


dotenv.config();

const server = Fastify({ logger: true });
server.register(websocket);


/* ============================
   JWT AUTH MIDDLEWARE
============================ */

async function authenticate(request: any, reply: any) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.status(401).send({ message: "Not authenticated" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    request.user = decoded;
  } catch (err) {
    return reply.status(401).send({ message: "Invalid token" });
  }
}

/* ============================
   GOOGLE OAUTH
============================ */

server.register(oauthPlugin, {
  name: "googleOAuth2",
  scope: ["profile", "email"],
  credentials: {
    client: {
      id: process.env.GOOGLE_CLIENT_ID as string,
      secret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    auth: oauthPlugin.GOOGLE_CONFIGURATION,
  },
  startRedirectPath: "/auth/google",
  callbackUri: "http://localhost:4000/auth/google/callback",
});

/* ============================
   EMAIL (OTP)
============================ */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ============================
   BASIC ROUTES
============================ */

server.get("/health", async () => {
  return { status: "ok" };
});

server.get("/protected", { preHandler: authenticate }, async (request: any) => {
  return {
    message: "You are authenticated",
    user: request.user,
  };
});

/* ============================
   GOOGLE CALLBACK
============================ */

server.get("/auth/google/callback", async function (request, reply) {
  try {
    const fastify = this as any;

    const token =
      await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
        request
      );

    const userInfo = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${token.token.access_token}`,
        },
      }
    );

    const { email, id: googleId, name, picture } = userInfo.data;

    if (!email.endsWith("@gmail.com")) {
      return reply.status(403).send({
        message: "Only Gmail accounts allowed",
      });
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          name,
          avatarUrl: picture,
        },
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.user.update({
      where: { email },
      data: {
        otpCode: otp,
        otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your ScribbleX OTP",
      text: `Your OTP is ${otp}`,
    });

    return reply.redirect(
  `http://localhost:5173/auth/callback?email=${user.email}`
);
  } catch (err) {
    console.error(err);
    return reply.status(500).send({
      message: "OAuth failed",
    });
  }
});

/* ============================
   VERIFY OTP
============================ */

server.post("/auth/verify-otp", async (request: any, reply) => {
  const { email, otp } = request.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  const otpString = String(otp).trim(); // 🔥 FIX

  if (
    !user ||
    user.otpCode !== otpString ||
    !user.otpExpiry ||
    user.otpExpiry < new Date()
  ) {
    return reply.status(400).send({ message: "Invalid or expired OTP" });
  }

  await prisma.user.update({
    where: { email },
    data: {
      isVerified: true,
      otpCode: null,
      otpExpiry: null,
    },
  });

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "1h" }
  );

  return reply.send({
    message: "Login successful",
    token,
  });
});

/* ============================
   CREATE ROOM
============================ */

server.post(
  "/rooms",
  { preHandler: authenticate },
  async (request: any, reply) => {
    const { name, isPublic } = request.body;
    const userId = request.user.userId;

    if (!name) {
      return reply.status(400).send({ message: "Room name required" });
    }

    const room = await prisma.room.create({
      data: {
        name,
        isPublic: isPublic ?? true,

        owner: {
          connect: { id: userId },
        },

        members: {
          create: {
            userId: userId,
            role: "OWNER",
          },
        },
      },
    });

    return reply.send(room);
  }
);

/* ============================
   LIST ROOMS
============================ */

server.get(
  "/rooms",
  { preHandler: authenticate },
  async (request: any) => {
    const userId = request.user.userId;

    const rooms = await prisma.room.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        owner: true,
        members: true,
      },
    });

    return rooms;
  }
);

/* ============================
   WEBSOCKET ROOM CONNECTION
============================ */

const activeRooms: Record<string, Set<any>> = {};

server.get(
  "/ws/rooms/:roomId",
  { websocket: true },
  (connection, request: any) => {

    const { roomId } = request.params;

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      connection.socket.close();
      return;
    }

    try {
      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      );

      const userId = decoded.userId;

      // Initialize room if not exists
      if (!activeRooms[roomId]) {
        activeRooms[roomId] = new Set();
      }

      activeRooms[roomId].add(connection.socket);

      console.log(`User ${userId} joined room ${roomId}`);

      // Notify others
      activeRooms[roomId].forEach((client) => {
        if (client !== connection.socket) {
          client.send(
            JSON.stringify({
              type: "USER_JOINED",
              userId,
            })
          );
        }
      });

      // Handle incoming messages
      connection.socket.on("message", (message: Buffer) => {
        const data = message.toString();

        // Broadcast to everyone in room
        activeRooms[roomId].forEach((client) => {
          if (client.readyState === 1) {
            client.send(data);
          }
        });
      });

      // Handle disconnect
      connection.socket.on("close", () => {
        activeRooms[roomId].delete(connection.socket);
        console.log(`User ${userId} left room ${roomId}`);
      });

    } catch (err) {
      connection.socket.close();
    }
  }
);


/* ============================
   START SERVER
============================ */

const start = async () => {
  try {
    await server.ready();
    console.log(server.printRoutes());
    await server.listen({ port: 4000, host: "0.0.0.0" });
    console.log("Server started");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
