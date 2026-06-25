import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { handleSocketEvents } from "./socket.event.js";
import { CustomSocket } from "../types/socket.types.js";

let io: Server | null = null;

export const setupSocket = (server: HttpServer, allowedOrigins: string | string[]) => {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  // Socket middleware for authentication
  io.use((socket: Socket, next: (err?: Error) => void) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication error: Token required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      (socket as CustomSocket).user = {
        userId: decoded.userId,
        role: decoded.role,
      };
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    handleSocketEvents(socket as CustomSocket);
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io has not been initialized. Call setupSocket first.");
  }
  return io;
};
