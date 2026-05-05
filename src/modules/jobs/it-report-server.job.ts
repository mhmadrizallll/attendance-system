import cron from "node-cron";
import { sendReportByDate } from "../report/it-report-server.service";

cron.schedule(
  "0 8 * * *",
  async () => {
    console.log("🔔 GENERATE IT REPORT...");

    try {
      const now = new Date();

      const yesterday = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
      );

      yesterday.setDate(yesterday.getDate() - 1);

      const date = yesterday.toLocaleDateString("sv-SE"); // ✅ FIX

      console.log("📅 DATE:", date);

      await sendReportByDate({
        date,
        deviceId: 1,
      });

      console.log("✅ REPORT SENT SUCCESS");
    } catch (err) {
      console.error("❌ ERROR:", err);
    }
  },
  {
    timezone: "Asia/Jakarta",
  },
);
