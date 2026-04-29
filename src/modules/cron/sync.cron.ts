import cron from "node-cron";
import { syncAllDevices } from "../workers/sync.worker";
import { syncUsersOnly } from "../workers/sync-user.worker";

// 🔁 attendance (sering)
export function startAttendanceCron() {
  cron.schedule("*/30 * * * * *", async () => {
    console.log("Sync attendance...");
    await syncAllDevices();
  });
}

// 👤 user (jarang)
export function startUserCron() {
  cron.schedule("0 */10 * * * *", async () => {
    console.log("Sync users...");
    await syncUsersOnly();
  });
}
