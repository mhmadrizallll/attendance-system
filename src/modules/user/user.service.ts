import db from "../../config/db";

import { getPrefixByRole } from "../../utils/getPrefixByRole";

// =========================
// GET USER DETAIL + LOGS
// =========================
export async function getUserWithAttendances(userId: number, loginUser: any) {
  const prefix = getPrefixByRole(loginUser.role);

  let userQuery = db("users").where({
    id: userId,
  });

  // ✅ FILTER ROLE
  if (prefix) {
    userQuery.where("device_user_id", "like", `${prefix}%`);
  }

  const user = await userQuery.first();

  if (!user) return null;

  const attendances = await db("attendances")
    .join("devices", "attendances.device_id", "devices.id")
    .where("attendances.user_id", userId)
    .select(
      "attendances.id",
      "attendances.timestamp",
      "attendances.type",
      "attendances.device_id",

      "devices.name as device_name",
      "devices.location",
      "devices.ip_address",
    )
    .orderBy("attendances.timestamp", "desc");

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

// =========================
// GET USERS
// =========================
export async function getUsersService(filters: any, user: any) {
  const { search, department, show_deleted } = filters;

  let query = db("users");

  // =========================
  // ROLE FILTER (INI INTI SYSTEM)
  // =========================

  if (user.role === "fig") {
    query.where("device_user_id", "like", "700%");
  }

  if (user.role === "fio") {
    query.where("device_user_id", "like", "400%");
  }

  if (user.role === "fin") {
    query.where("device_user_id", "like", "000%");
  }

  // superadmin = semua data

  // =========================
  // DELETE FILTER
  // =========================
  if (show_deleted === "true") {
    query.whereNotNull("deleted_at");
  } else {
    query.whereNull("deleted_at");
  }

  // =========================
  // SEARCH
  // =========================
  if (search) {
    query.where((b) => {
      b.whereILike("name", `%${search}%`).orWhereILike(
        "device_user_id",
        `%${search}%`,
      );
    });
  }

  // =========================
  // DEPARTMENT FILTER
  // =========================
  if (department) {
    query.where("department", department);
  }

  return query.select(
    "id",
    "device_user_id",
    "name",
    "department",
    "status",
    "start_date",
    "card_number",
    "created_at",
    "updated_at",
    "deleted_at",
  );
}

// =========================
// UPDATE USER
// =========================
export async function updateUser(id: string, payload: any) {
  const { name, department, card_number } = payload;

  const updated = await db("users")
    .where({ id })
    .whereNull("deleted_at")

    .update({
      name,
      department,
      card_number,
    })

    .returning("*");

  return updated[0];
}

// =========================
// SOFT DELETE
// =========================
export async function deleteUser(id: string) {
  return db("users")
    .where({ id })

    .update({
      deleted_at: new Date(),
    });
}

// =========================
// RESTORE USER
// =========================
export async function restoreUser(id: string) {
  const updated = await db("users")
    .where({ id })

    .update({
      deleted_at: null,
    })

    .returning("*");

  return updated[0];
}
