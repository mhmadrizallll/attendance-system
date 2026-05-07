import db from "../../config/db";

export async function getDepartmentsService() {
  return db("users")
    .distinct("department")
    .whereNotNull("department")
    .orderBy("department");
}
