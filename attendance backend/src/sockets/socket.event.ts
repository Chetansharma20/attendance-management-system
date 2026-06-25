import { CustomSocket } from "../types/socket.types.js";

export const handleSocketEvents = (socket: CustomSocket) => {
  const { userId, role } = socket.user || { userId: "", role: "" };

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
};
