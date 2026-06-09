import db from "../../config/db";
import { sendItReport } from "../email/it-email-server.service";

const SERVER_IP = "10.28.1.221";

export async function sendReportByDate({
  start_date,
  end_date,
}: {
  start_date: string;
  end_date: string;
}) {
  console.log("📅 START:", start_date);
  console.log("📅 END:", end_date);

  let query = db("attendances as a")
    .join("users as u", "u.id", "a.user_id")
    .join("devices as d", "d.id", "a.device_id")
    .where("d.ip_address", SERVER_IP);

  // FILTER TANGGAL
  if (start_date && end_date) {
    query.whereRaw(
      `DATE(a.timestamp AT TIME ZONE 'Asia/Jakarta')
       BETWEEN ? AND ?`,
      [start_date, end_date],
    );
  } else if (start_date) {
    query.whereRaw(`DATE(a.timestamp AT TIME ZONE 'Asia/Jakarta') = ?`, [
      start_date,
    ]);
  }

  const logs = await query.select(
    "u.name",
    "a.device_user_id",
    "a.timestamp",
    "d.name as device_name",
  );

  console.log("📊 TOTAL LOGS:", logs.length);

  const itUsers = await db("it_recipients").select("email");

  const emails = itUsers.map((u) => u.email);

  await sendItReport(
    logs,
    emails,
    start_date === end_date ? start_date : `${start_date} s/d ${end_date}`,
  );

  console.log("✅ REPORT SENT");
}
