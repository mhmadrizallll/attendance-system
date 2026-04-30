import db from "../../config/db";
import { sendItReport } from "../email/it-email-server.service";

export async function sendReportByDate({
  date,
  deviceId,
}: {
  date: string;
  deviceId: number;
}) {
  console.log("📅 FILTER DATE:", date);

  const logs = await db("attendances")
    .join("users", "users.id", "attendances.user_id")
    .where("attendances.device_id", deviceId)
    .whereRaw("DATE(attendances.timestamp AT TIME ZONE 'Asia/Jakarta') = ?", [
      date,
    ])
    .select(
      "users.name",
      "attendances.device_user_id",
      "attendances.timestamp",
    );

  console.log("📊 TOTAL LOGS:", logs.length);

  const itUsers = await db("it_recipients").select("email");
  const emails = itUsers.map((u) => u.email);

  // 🔥 FIX UTAMA DI SINI
  await sendItReport(logs, emails, date);

  console.log("✅ REPORT SENT:", date);
}
