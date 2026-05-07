import db from "../../config/db";

export async function getAttendancesService(filters: any) {
  const { date, device_id, user_id } = filters;

  let query = db("attendances")
    .leftJoin("users", "attendances.user_id", "users.id")
    .leftJoin("devices", "attendances.device_id", "devices.id")
    .select(
      "attendances.*",
      "users.name as user_name",
      "users.department",
      "devices.name as device_name",
    )
    .orderBy("attendances.timestamp", "desc");

  // FILTER DATE
  if (date && date !== "") {
    query.whereRaw("DATE(attendances.timestamp) = ?", [date]);
  }

  // FILTER DEVICE
  if (device_id && device_id !== "") {
    query.where("attendances.device_id", Number(device_id));
  }

  // FILTER USER
  if (user_id && user_id !== "") {
    query.where("attendances.user_id", Number(user_id));
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
    total_attendance_today: Number(total?.total || 0),
    total_devices: Number(devices?.total || 0),
  };
}

export async function getAttendanceByDate(date: string) {
  try {
    const data = await db("attendances as a")
      .join("users as u", "a.user_id", "u.id")
      .select(
        "a.device_id",
        "a.device_user_id",
        "a.timestamp",
        "u.name",
        "u.department",
      )
      .whereRaw("DATE(a.timestamp) = ?", [date])
      .orderBy("a.timestamp", "desc");

    return data.map((item) => {
      const d = new Date(item.timestamp);

      return {
        device_id: item.device_id,
        device_user_id: item.device_user_id,
        name: item.name,
        department: item.department,
        date: d.toISOString().split("T")[0],
        time: d.toTimeString().split(" ")[0],
      };
    });
  } catch (err) {
    console.error("GET DATE ERROR:", err);
    throw err;
  }
}

export async function getSummaryByDate(date: string) {
  try {
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
  } catch (err) {
    console.error("SUMMARY DATE ERROR:", err);
    throw err;
  }
}

export async function getAttendanceByDateAndDept(date: string, dept?: string) {
  let query = db("attendances as a")
    .join("users as u", "a.user_id", "u.id")
    .whereRaw("DATE(a.timestamp) = ?", [date]);

  // FILTER DEPARTMENT
  if (dept && dept !== "") {
    query.where("u.department", dept);
  }

  try {
    const data = await query
      .select(
        "a.device_id",
        "a.device_user_id",
        "a.timestamp",
        "u.name",
        "u.department",
      )
      .orderBy("a.timestamp", "desc");

    return data.map((item) => {
      const d = new Date(item.timestamp);

      return {
        device_id: item.device_id,
        device_user_id: item.device_user_id,
        name: item.name,
        department: item.department,
        date: d.toISOString().split("T")[0],
        time: d.toTimeString().split(" ")[0],
      };
    });
  } catch (err) {
    console.error("DATE DEPT ERROR:", err);
    throw err;
  }
}

export async function getAttendanceByFilters(filters: any) {
  const { date, dept, device_id, user_id } = filters;

  console.log("FILTERS:", filters);

  let query = db("attendances as a")
    .join("users as u", "a.user_id", "u.id")
    .leftJoin("devices as d", "a.device_id", "d.id");

  // FILTER DATE
  if (date && date !== "") {
    query.whereRaw("DATE(a.timestamp) = ?", [date]);
  }

  // FILTER DEVICE
  if (device_id && device_id !== "") {
    query.where("a.device_id", Number(device_id));
  }

  // FILTER USER
  if (user_id && user_id !== "") {
    query.where("a.user_id", Number(user_id));
  }

  // FILTER DEPARTMENT
  if (dept && dept !== "") {
    query.where("u.department", dept);
  }

  try {
    const data = await query
      .select(
        "a.device_id",
        "a.device_user_id",
        "u.name",
        "u.department",
        "d.name as device_name",
        "a.timestamp",
      )
      .orderBy("a.timestamp", "desc");

    return data.map((item) => {
      const d = new Date(item.timestamp);

      return {
        device_id: item.device_id,
        device_name: item.device_name,
        device_user_id: item.device_user_id,
        name: item.name,
        department: item.department,
        date: d.toISOString().split("T")[0],
        time: d.toTimeString().split(" ")[0],
      };
    });
  } catch (err) {
    console.error("FILTER ERROR:", err);
    throw err;
  }
}

export async function getSummaryByFilters(filters: any) {
  const { date, dept, device_id } = filters;

  let base = db("attendances as a").join("users as u", "a.user_id", "u.id");

  // FILTER DATE
  if (date && date !== "") {
    base.whereRaw("DATE(a.timestamp) = ?", [date]);
  }

  // FILTER DEVICE
  if (device_id && device_id !== "") {
    base.where("a.device_id", Number(device_id));
  }

  // FILTER DEPARTMENT
  if (dept && dept !== "") {
    base.where("u.department", dept);
  }

  try {
    const totalAttendance = await base.clone().count("* as total");

    const uniqueUsers = await base
      .clone()
      .countDistinct("a.device_user_id as total");

    const activeDevices = await base
      .clone()
      .countDistinct("a.device_id as total");

    return {
      totalAttendance: Number(totalAttendance[0].total),
      uniqueUsers: Number(uniqueUsers[0].total),
      activeDevices: Number(activeDevices[0].total),
    };
  } catch (err) {
    console.error("SUMMARY FILTER ERROR:", err);
    throw err;
  }
}
