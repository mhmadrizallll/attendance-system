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
