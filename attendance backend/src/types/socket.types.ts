import { Socket } from "socket.io";

export interface ISocketUser {
  userId: string;
  role: "admin" | "manager" | "employee";
}

export interface CustomSocket extends Socket {
  user?: ISocketUser;
}
