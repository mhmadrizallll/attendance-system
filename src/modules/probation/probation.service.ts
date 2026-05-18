// probation.service.ts

import db from "../../config/db";

export async function getProbationReminderUsers() {
  return (
    db("users")
      .whereNull("deleted_at")

      .whereILike("status", "%Probation%")

      .where("probation_notified", false)

      // H-7 SEBELUM 2 BULAN
      .whereRaw(
        `
      CURRENT_DATE >= DATE(start_date + INTERVAL '2 month' - INTERVAL '7 day')
    `,
      )

      .select(
        "id",
        "device_user_id",
        "name",
        "department",
        "status",
        "start_date",
      )
  );
}
