import http from "http";
import { connectDB } from "./src/db/db";
import { ENV_VALUE } from "./src/utils/env";
import app from "./src/app";
import { initializeSocket } from "./src/services/websocket.services";

const server = http.createServer(app);

connectDB()
  .then(() => {
    initializeSocket(server);
    server.listen(ENV_VALUE.PORT, () =>
      console.log(`✅ NursingPracticer API listening on ${ENV_VALUE.PORT}`),
    );
  })
  .catch((error) => {
    console.log("❌ Database connection failed", error);
  });
