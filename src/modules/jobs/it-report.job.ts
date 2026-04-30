import cron from "node-cron";
import { sendItReportByDate } from "../report/it-report.service";

cron.schedule("33 11 * * *", async () => {
  try {
    const now = new Date();

    // WIB (biar gak geser)
    const yesterday = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
    );

    yesterday.setDate(yesterday.getDate() - 1);

    const date = yesterday.toLocaleDateString("sv-SE"); // YYYY-MM-DD

    console.log("⏰ CRON RUN, DATE:", date);

    await sendItReportByDate({ date });
  } catch (error) {
    console.error("❌ CRON ERROR:", error);
  }
});
