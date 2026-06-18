import db from "../../config/db";

export async function getAttendancesService(filters: any, user: any) {
  const { date, start_date, end_date, device_id, user_id } = filters;

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
    query.whereRaw('DATE(attendances."timestamp") = ?', [date]);
  }

  if (start_date && end_date) {
    query.whereRaw('DATE(attendances."timestamp") BETWEEN ? AND ?', [
      start_date,
      end_date,
    ]);
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

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");

    return {
      device_id: item.device_id,
      device_user_id: item.device_user_id,
      name: item.name,
      department: item.department,
      date: `${yyyy}-${mm}-${dd}`,
      time: d.toTimeString().split(" ")[0],
    };
  });
}

export async function getAttendanceByFilters(filters: any, user: any) {
  const { date, start_date, end_date, dept, device_id, user_id } = filters;

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
  // single date
  if (date) {
    query.whereRaw('DATE(a."timestamp") = ?', [date]);
  }

  // range date
  if (start_date && end_date) {
    query.whereRaw('DATE(a."timestamp") BETWEEN ? AND ?', [
      start_date,
      end_date,
    ]);
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

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");

    return {
      device_id: item.device_id,
      device_name: item.device_name,
      device_user_id: item.device_user_id,
      name: item.name,
      department: item.department,
      date: `${yyyy}-${mm}-${dd}`,
      time: d.toTimeString().split(" ")[0],
    };
  });
}

export async function getSummaryByFilters(filters: any, user: any) {
  const { date, start_date, end_date, dept, device_id } = filters;

  let base = db("attendances as a").join("users as u", "a.user_id", "u.id");

  // =====================
  // FILTER DATE
  // =====================
  if (date) {
    base.whereRaw('DATE(a."timestamp") = ?', [date]);
  }

  if (start_date && end_date) {
    base.whereRaw('DATE(a."timestamp") BETWEEN ? AND ?', [
      start_date,
      end_date,
    ]);
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

export async function exportAttendanceService(filters: any, user: any) {
  const {
    type, // today | date | range
    date,
    start_date,
    end_date,
    dept,
  } = filters;

  let query = db("attendances as a")
    .join("users as u", "a.user_id", "u.id")
    .leftJoin("devices as d", "a.device_id", "d.id")
    .select("a.device_user_id", "a.timestamp", "u.department")
    .whereRaw("(d.ip_address IS NULL OR d.ip_address <> ?)", ["10.28.1.221"])
    .orderBy("a.timestamp", "asc");

  // ====================================
  // FILTER DATE
  // ====================================

  if (type === "today") {
    query.whereRaw('DATE(a."timestamp") = CURRENT_DATE');
  }

  if (type === "date" && date) {
    query.whereRaw('DATE(a."timestamp") = ?', [date]);
  }

  if (type === "range" && start_date && end_date) {
    query.whereRaw('DATE(a."timestamp") BETWEEN ? AND ?', [
      start_date,
      end_date,
    ]);
  }

  // ====================================
  // ROLE SECURITY
  // ====================================

  const role = (user?.role || "").toUpperCase();

  const rolePrefixMap: Record<string, string> = {
    FIG: "700",
    FIO: "400",
    FIN: "000",
  };

  if (["ADMIN", "SUPERADMIN"].includes(role)) {
    if (dept && dept !== "") {
      query.where("u.department", dept);
    }
  } else {
    const prefix = rolePrefixMap[role];

    if (!prefix) {
      return [];
    }

    query.whereRaw("CAST(a.device_user_id AS TEXT) LIKE ?", [`${prefix}%`]);
  }

  // ====================================
  // EXECUTE QUERY
  // ====================================

  const data = await query;

  // ====================================
  // AMBIL IN & OUT
  // ====================================

  const grouped = new Map();

  for (const item of data) {
    const d = new Date(item.timestamp);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");

    const dateKey = `${yyyy}-${mm}-${dd}`;

    const key = `${item.device_user_id}_${dateKey}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        in: null,
        out: null,
      });
    }

    const row = grouped.get(key);

    const totalMinutes = d.getHours() * 60 + d.getMinutes();

    // IN = 07:15 - 14:59
    if (totalMinutes >= 435 && totalMinutes < 900) {
      if (!row.in || d.getTime() < new Date(row.in.timestamp).getTime()) {
        row.in = item;
      }
    }

    // OUT = >= 15:00
    if (totalMinutes >= 900) {
      if (!row.out || d.getTime() > new Date(row.out.timestamp).getTime()) {
        row.out = item;
      }
    }
  }

  const finalData: any[] = [];

  for (const row of grouped.values()) {
    if (row.in) finalData.push(row.in);
    if (row.out) finalData.push(row.out);
  }

  // ====================================
  // FORMAT TXT
  // ====================================

  return finalData
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )
    .map((item) => {
      const d = new Date(item.timestamp);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");

      const hh = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");

      const uid = String(item.device_user_id).padStart(10, "0");

      return `${uid};${yyyy}/${mm}/${dd};${hh}:${mi}`;
    });
}
