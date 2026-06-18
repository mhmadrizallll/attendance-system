import db from "../../config/db";
import { sendItReport } from "../email/it-email.service";

export async function sendItReportByDate({
  start_date,
  end_date,
}: {
  start_date: string;
  end_date: string;
}) {
  const DEVICE_IDS = [2, 1];

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

  console.log("📅 START:", start_date);
  console.log("📅 END:", end_date);

  let query = db("attendances")
    .join("users", "users.id", "attendances.user_id")
    .whereIn("attendances.device_id", DEVICE_IDS)
    .whereIn("attendances.device_user_id", DEVICE_USER_IDS);

  if (start_date && end_date) {
    query.whereRaw('DATE(attendances."timestamp") BETWEEN ? AND ?', [
      start_date,
      end_date,
    ]);
  } else if (start_date) {
    query.whereRaw('DATE(attendances."timestamp") = ?', [start_date]);
  }

  const logs = await query.select(
    "users.name",
    "attendances.device_user_id",
    "attendances.timestamp",
  );

  const itUsers = await db("it_recipients").select("email");
  const emails = itUsers.map((u) => u.email);

  await sendItReport(
    logs,
    emails,
    start_date === end_date ? start_date : `${start_date} s/d ${end_date}`,
  );
}
