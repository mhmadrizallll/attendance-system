import db from "../../config/db";

export async function getAttendancesService(filters: any) {
  const { date, device_id, user_id } = filters;

  let query = db("attendances")
    .leftJoin("users", "attendances.user_id", "users.id")
    .leftJoin("devices", "attendances.device_id", "devices.id")
    .select(
      "attendances.*",
      "users.name as user_name",
      "devices.name as device_name",
    )
    .orderBy("timestamp", "desc");

  if (date) {
    query = query.whereRaw("DATE(attendances.timestamp) = ?", [date]);
  }

  if (device_id) {
    query = query.where("attendances.device_id", device_id);
  }

  if (user_id) {
    query = query.where("attendances.user_id", user_id);
  }

  return query;
}

export async function getSummaryService() {
  const today = new Date().toISOString().slice(0, 10);

  const total = await db("attendances")
    .whereRaw("DATE(timestamp) = ?", [today])
    .count("* as total")
    .first();

  const devices = await db("devices").count("* as total").first();

  return {
    total_attendance_today: total?.total || 0,
    total_devices: devices?.total || 0,
  };
}
