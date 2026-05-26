import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { ENV_VALUE } from "../utils/env";
import { User } from "../models/user.models";

let io: SocketIOServer | null = null;

export const initializeSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: ENV_VALUE.CORS_ORIGIN,
      credentials: true,
    },
  });

  // JWT Authentication for Socket Connections
  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.auth.token || socket.handshake.headers.authorization;
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7)
        : authHeader;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(
        token,
        ENV_VALUE.JWT.ACCESS_TOKEN_SECRET as jwt.Secret,
      ) as { _id: string };

      const user = await User.findById(decoded._id).select("-password");
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    const userIdStr = user._id.toString();

    console.log(`🔌 Client connected: ${userIdStr} (${user.role})`);

    // Join room for this specific user
    socket.join(userIdStr);

    // Join specialized role rooms
    if (user.role === "nurse") {
      socket.join("nurses");
    }

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${userIdStr}`);
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized yet!");
  }
  return io;
};
export { io };
