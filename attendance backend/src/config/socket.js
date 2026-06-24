import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io = null;

export const setupSocket = (server, allowedOrigins) => {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  // Socket middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication error: Token required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = {
        userId: decoded.userId,
        role: decoded.role,
      };
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, role } = socket.user;
    
    // Join a room named after their unique userId
    socket.join(userId.toString());
    console.log(`[Socket] User connected: ${userId} (Role: ${role}) joined room: ${userId}`);

    // If the user is an admin, join the general admins room
    if (role === "admin") {
      socket.join("admins");
      console.log(`[Socket] Admin: ${userId} joined room: admins`);
    }

    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${userId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io has not been initialized. Call setupSocket first.");
  }
  return io;
};
