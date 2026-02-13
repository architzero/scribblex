import { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

const activeRooms: Record<string, Set<any>> = {};

export async function registerWebsocket(app: FastifyInstance) {

  app.get(
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
          env.JWT_SECRET
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
          
          // Clean up empty rooms
          if (activeRooms[roomId].size === 0) {
            delete activeRooms[roomId];
          }
          
          console.log(`User ${userId} left room ${roomId}`);
        });

      } catch (err) {
        connection.socket.close();
      }
    }
  );

}
