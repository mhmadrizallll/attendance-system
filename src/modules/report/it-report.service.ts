import db from "../../config/db";
import { sendItReport } from "../email/it-email.service";

export async function sendItReportByDate({ date }: { date: string }) {
  const DEVICE_IDS = [2, 3];
  const DEVICE_USER_IDS = [
    "700092",
    "700093",
    "700094",
    "700095",
    "700096",
    "700097",
    "700100",
    "700101",
    "700103",
    "700141",
  ];

  console.log("📅 QUERY DATE:", date);

  const logs = await db("attendances")
    .join("users", "users.id", "attendances.user_id")
    .whereIn("attendances.device_id", DEVICE_IDS)
    .whereIn("attendances.device_user_id", DEVICE_USER_IDS)
    .whereRaw("DATE(attendances.timestamp) = ?", [date])
    .select(
      "users.name",
      "attendances.device_user_id",
      "attendances.timestamp",
    );

  const itUsers = await db("it_recipients").select("email");
  const emails = itUsers.map((u) => u.email);

  // ✅ FIX DI SINI
  await sendItReport(logs, emails, date);
}
