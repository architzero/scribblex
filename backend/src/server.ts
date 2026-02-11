import Fastify from "fastify";
import dotenv from "dotenv";
import prisma from "./prisma";
import oauthPlugin from "@fastify/oauth2";
import axios from "axios";
import jwt from "jsonwebtoken";
import { sendOTPEmail } from "./email";
import cookie from "@fastify/cookie";

dotenv.config();

const server = Fastify({ logger: true });

/* ===============================
   REGISTER COOKIE SUPPORT
================================= */

server.register(cookie);

/* ===============================
   GOOGLE OAUTH
================================= */

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

/* ===============================
   AUTH MIDDLEWARE
================================= */

const authenticate = async (request: any, reply: any) => {
  try {
    const token = request.cookies.token;

    if (!token) {
      return reply.status(401).send({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    );

    request.user = decoded;
  } catch (err) {
    return reply.status(401).send({ message: "Invalid token" });
  }
};

/* ===============================
   BASIC ROUTES
================================= */

server.get("/health", async () => {
  return { status: "ok" };
});

server.get("/protected", { preHandler: authenticate }, async (request: any) => {
  return {
    message: "You are authenticated",
    user: request.user,
  };
});

/* ===============================
   GOOGLE CALLBACK
================================= */

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
        message: "Only Gmail accounts are allowed.",
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
          isVerified: false,
        },
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: {
        otpCode: otp,
        otpExpiry,
      },
    });

    await sendOTPEmail(email, otp);

    return reply.send({
      message: "OTP sent to your email.",
      email,
    });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ message: "OAuth failed" });
  }
});

/* ===============================
   OTP VERIFY
================================= */

server.post("/auth/verify-otp", async (request, reply) => {
  try {
    const { email, otp } = request.body as {
      email: string;
      otp: string;
    };

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.otpCode || !user.otpExpiry) {
      return reply.status(400).send({ message: "Invalid request" });
    }

    if (user.otpCode !== otp) {
      return reply.status(401).send({ message: "Invalid OTP" });
    }

    if (new Date() > user.otpExpiry) {
      return reply.status(401).send({ message: "OTP expired" });
    }

    await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiry: null,
      },
    });

    const authToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    reply.setCookie("token", authToken, {
      httpOnly: true,
      secure: false, // true in production (HTTPS)
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });

    return reply.send({
      message: "Verification successful",
    });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ message: "Verification failed" });
  }
});

/* ===============================
   LOGOUT
================================= */

server.post("/auth/logout", async (request, reply) => {
  reply.clearCookie("token");
  return reply.send({ message: "Logged out successfully" });
});

/* ===============================
   START SERVER
================================= */

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
