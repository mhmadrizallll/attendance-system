import db from "../../config/db";

export async function getUserWithAttendances(userId: number) {
  const user = await db("users").where({ id: userId }).first();

  if (!user) return null;

  const attendances = await db("attendances")
    .join("devices", "attendances.device_id", "devices.id")
    .where("attendances.user_id", userId)
    .select(
      "attendances.id",
      "attendances.timestamp",
      "attendances.type",
      "devices.name as device_name",
      "devices.location",
      "devices.ip_address",
    )
    .orderBy("attendances.timestamp", "desc");

  // 🔥 TAMBAHIN INI (FORMAT TIMESTAMP)
  const formattedAttendances = attendances.map((a) => ({
    ...a,
    timestamp_readable: new Date(a.timestamp).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "medium",
      timeStyle: "short",
    }),
  }));

  return {
    user,
    attendances: formattedAttendances,
  };
}

export async function getUsersService(filters: any) {
  const { search, department } = filters;

  let query = db("users")
    .select(
      "id",
      "device_user_id",
      "name",
      "department",
      "card_number",
      "created_at",
    )
    .orderBy("name", "asc");

  // 🔥 SEARCH NAME / NIK
  if (search && search !== "") {
    query.where((builder) => {
      builder
        .whereILike("name", `%${search}%`)
        .orWhereILike("device_user_id", `%${search}%`);
    });
  }

  // 🔥 FILTER DEPARTMENT
  if (department && department !== "") {
    query.where("department", department);
  }

  return query;
}

export async function updateUser(id: string, payload: any) {
  const { name, department, card_number } = payload;

  const updated = await db("users")
    .where({ id })

    // 🔥 jangan update device_user_id
    .update({
      name,
      department,
      card_number,
    })

    .returning("*");

  return updated[0];
}
