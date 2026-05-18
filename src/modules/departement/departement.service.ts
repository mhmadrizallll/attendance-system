import db from "../../config/db";

export async function getDepartmentsService(user: any) {
  let query = db("users").distinct("department");

  // =========================
  // ROLE FILTER (SAMA SEPERTI USERS)
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

  const result = await query;

  return result;
}
