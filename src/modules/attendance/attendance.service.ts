import db from "../../config/db";

export async function getAttendancesService(filters: any, user: any) {
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

  // =========================
  // 🔐 ROLE FILTER (INI INTI)
  // =========================

  if (user.role === "FIG") {
    query.where("attendances.device_user_id", "like", "700%");
  }

  if (user.role === "FIO") {
    query.where("attendances.device_user_id", "like", "400%");
  }

  if (user.role === "FIN") {
    query.where("attendances.device_user_id", "like", "000%");
  }

  // ADMIN / SUPERADMIN => tidak difilter

  // =========================
  // FILTER LAIN
  // =========================

  if (date) {
    query.whereRaw("DATE(attendances.timestamp) = ?", [date]);
  }

  if (device_id) {
    query.where("attendances.device_id", Number(device_id));
  }

  if (user_id) {
    query.where("attendances.user_id", Number(user_id));
  }

  return query;
}

export async function getAttendanceByDateAndDept(
  date: string,
  dept: string | undefined,
  user: any,
) {
  let query = db("attendances as a")
    .join("users as u", "a.user_id", "u.id")
    .whereRaw("DATE(a.timestamp) = ?", [date]);

  // =====================
  // DEPARTMENT FILTER (optional UI)
  // =====================
  if (dept && dept !== "") {
    query.where("u.department", dept);
  }

  // =====================
  // ROLE SECURITY (INI YANG KAMU LUPA)
  // =====================
  const role = (user?.role || "").toUpperCase();

  const rolePrefixMap: Record<string, string> = {
    FIG: "700",
    FIO: "400",
    FIN: "000",
  };

  if (!["ADMIN", "SUPERADMIN"].includes(role)) {
    const prefix = rolePrefixMap[role];

    if (prefix) {
      query.whereRaw("LEFT(u.device_user_id, 3) = ?", [prefix]);
    } else {
      return []; // role tidak valid → block semua
    }
  }

  // =====================
  // EXECUTE QUERY
  // =====================
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
}

export async function getAttendanceByFilters(filters: any, user: any) {
  const { date, dept, device_id, user_id } = filters;

  let query = db("attendances as a")
    .join("users as u", "a.user_id", "u.id")
    .leftJoin("devices as d", "a.device_id", "d.id");

  // =====================
  // DEBUG USER (sementara, hapus di production)
  // =====================
  console.log("USER:", user);

  // =====================
  // DATE FILTER
  // =====================
  if (date) {
    query.whereRaw("DATE(a.timestamp) = ?", [date]);
  }

  // =====================
  // DEVICE FILTER
  // =====================
  if (device_id && !isNaN(Number(device_id))) {
    query.where("a.device_id", Number(device_id));
  }

  // =====================
  // USER FILTER
  // =====================
  if (user_id && !isNaN(Number(user_id))) {
    query.where("a.user_id", Number(user_id));
  }

  // =====================
  // DEPARTMENT FILTER (UI)
  // =====================
  if (dept) {
    query.where("u.department", dept);
  }

  // =====================
  // ROLE SECURITY FILTER (FIXED VERSION)
  // =====================
  const role = (user?.role || "").toUpperCase();

  const rolePrefixMap: Record<string, string> = {
    FIG: "700",
    FIO: "400",
    FIN: "000",
  };

  if (!["ADMIN", "SUPERADMIN"].includes(role)) {
    const prefix = rolePrefixMap[role];

    if (prefix) {
      query.whereRaw("LEFT(u.device_user_id, 3) = ?", [prefix]);
    } else {
      // kalau role tidak dikenal → jangan kasih data sama sekali (lebih aman)
      return [];
    }
  }

  // =====================
  // EXECUTE QUERY
  // =====================
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

  // =====================
  // FORMAT RESPONSE
  // =====================
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
}

export async function getSummaryByFilters(filters: any, user: any) {
  const { date, dept, device_id } = filters;

  let base = db("attendances as a").join("users as u", "a.user_id", "u.id");

  // =====================
  // FILTER DATE
  // =====================
  if (date && date !== "") {
    base.whereRaw("DATE(a.timestamp) = ?", [date]);
  }

  // =====================
  // DEVICE FILTER
  // =====================
  if (device_id && device_id !== "") {
    base.where("a.device_id", Number(device_id));
  }

  // =====================
  // DEPARTMENT FILTER
  // =====================
  if (dept && dept !== "") {
    base.where("u.department", dept);
  }

  // =====================
  // ROLE SECURITY (INI YANG KAMU LUPA)
  // =====================
  const role = (user?.role || "").toUpperCase();

  const rolePrefixMap: Record<string, string> = {
    FIG: "700",
    FIO: "400",
    FIN: "000",
  };

  if (!["ADMIN", "SUPERADMIN"].includes(role)) {
    const prefix = rolePrefixMap[role];

    if (!prefix) {
      return {
        totalAttendance: 0,
        uniqueUsers: 0,
        activeDevices: 0,
      };
    }

    base.whereRaw("LEFT(u.device_user_id, 3) = ?", [prefix]);
  }

  // =====================
  // EXECUTE
  // =====================
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
}
