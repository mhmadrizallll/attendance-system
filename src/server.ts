import http from "http";
import app from "./app";

import { initSocket } from "./realtime/socket";
import { startAttendanceCron, startUserCron } from "./modules/cron/sync.cron";
import { startDebugListener } from "./realtime/debug.listener";

// 🔥 aktifkan cron job
import "./modules/jobs/it-report-server.job";
import "./modules/jobs/it-report.job";

import "./modules/probation/probation.cron";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// 🔥 INIT SOCKET DI SINI (INI STEP 7 PENTING)
initSocket(server);

// 🔁 START CRON
startAttendanceCron();
startUserCron();

startDebugListener();

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
