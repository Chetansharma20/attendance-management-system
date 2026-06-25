import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSelector } from "react-redux";
import { io, Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const token = useSelector((state: any) => state.auth.accessToken);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    const newSocket = io(socketUrl, {
      auth: {
        token,
      },
      transports: ["websocket"],
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("[Socket] Connected to WebSocket server");
    });

    newSocket.on("connect_error", (err: Error) => {
      console.error("[Socket] Connection error:", err.message);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
