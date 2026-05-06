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

export async function getAttendanceByDate(date: string) {
  try {
    const data = await db("attendances as a")
      .join("users as u", "a.user_id", "u.id")
      .select("a.device_id", "a.device_user_id", "a.timestamp", "u.name")
      .whereRaw("DATE(a.timestamp) = ?", [date])
      .orderBy("a.timestamp", "desc");

    return data.map((item) => {
      const d = new Date(item.timestamp);

      return {
        device_id: item.device_id,
        device_user_id: item.device_user_id,
        name: item.name,
        date: d.toISOString().split("T")[0],
        time: d.toTimeString().split(" ")[0],
      };
    });
  } catch (err) {
    console.error("SERVICE ERROR:", err);
    throw err;
  }
}

export async function getSummaryByDate(date: string) {
  const totalAttendance = await db("attendances")
    .whereRaw("DATE(timestamp) = ?", [date])
    .count("* as total");

  const uniqueUsers = await db("attendances")
    .whereRaw("DATE(timestamp) = ?", [date])
    .countDistinct("device_user_id as total");

  const activeDevices = await db("attendances")
    .whereRaw("DATE(timestamp) = ?", [date])
    .countDistinct("device_id as total");

  return {
    totalAttendance: Number(totalAttendance[0].total),
    uniqueUsers: Number(uniqueUsers[0].total),
    activeDevices: Number(activeDevices[0].total),
  };
}

export async function getAttendanceByDateAndDept(date: string, dept?: string) {
  let query = db("attendances as a")
    .join("users as u", "a.user_id", "u.id")
    .whereRaw("DATE(a.timestamp) = ?", [date]);

  // 🔥 filter dept
  if (dept === "FIG") {
    query = query.whereBetween("a.device_user_id", ["700000", "799999"]);
  }

  if (dept === "FIO") {
    query = query.whereBetween("a.device_user_id", ["400000", "499999"]);
  }

  const data = await query
    .select("a.device_id", "a.device_user_id", "a.timestamp", "u.name")
    .orderBy("a.timestamp", "desc");

  // 🔥 mapping biar sama kayak yang lain
  return data.map((item) => {
    const d = new Date(item.timestamp);

    return {
      device_id: item.device_id,
      device_user_id: item.device_user_id,
      name: item.name,
      date: d.toISOString().split("T")[0],
      time: d.toTimeString().split(" ")[0],
    };
  });
}
