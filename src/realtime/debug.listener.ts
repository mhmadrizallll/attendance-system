import { getIO } from "./socket";

export function startDebugListener() {
  const io = getIO();

  io.on("connection", (socket) => {
    console.log("🧪 DEBUG SOCKET READY");

    socket.on("attendance:new", (data) => {
      console.log("🔥 REALTIME ATTENDANCE RECEIVED:", data);
    });
  });
}
