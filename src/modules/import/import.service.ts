// import.service.ts

import * as XLSX from "xlsx";

import db from "../../config/db";

export async function importUsersFromExcel(filePath: string) {
  // =========================
  // READ EXCEL
  // =========================
  const workbook = XLSX.readFile(filePath);

  const sheetName = workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];

  // RAW JSON
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  console.log("FIRST ROW:", rows[0]);

  // =========================
  // RESULT
  // =========================
  const updatedUsers: any[] = [];

  const insertedUsers: any[] = [];

  // =========================
  // LOOP DATA
  // =========================
  for (const row of rows) {
    console.log(row);

    // =========================
    // GET VALUE FROM EXCEL
    // =========================
    const nik = String(row["Employee No."] || "")
      .replace(".0", "")
      .trim();

    const name = String(row["Name"] || "").trim();

    // 🔥 LANGSUNG AMBIL DARI KOLOM EXCEL
    const department = String(row["Group name"] || "").trim();

    const status = String(row["Employment Status Name"] || "").trim();

    const start_date = row["Start Date"] ? new Date(row["Start Date"]) : null;

    // =========================
    // SKIP
    // =========================
    if (nik === "Employee No.") {
      continue;
    }

    if (!nik) {
      continue;
    }

    // =========================
    // FIND USER
    // =========================
    const existingUser = await db("users")
      .whereRaw("TRIM(device_user_id) = ?", [nik])
      .first();

    // =========================
    // UPDATE
    // =========================
    if (existingUser) {
      const oldDepartment = existingUser.department;

      await db("users")
        .where({
          id: existingUser.id,
        })
        .update({
          name: name || existingUser.name,

          department,

          status,

          start_date,
        });

      updatedUsers.push({
        device_user_id: nik,

        changes: {
          department: {
            old: oldDepartment,
            new: department,
          },
        },
      });

      console.log(`✅ UPDATED ${nik}: ${oldDepartment} -> ${department}`);
    }

    // =========================
    // INSERT
    // =========================
    else {
      await db("users").insert({
        device_user_id: nik,

        name,

        department,

        status,

        start_date,
      });

      insertedUsers.push({
        device_user_id: nik,

        name,

        department,

        status,

        start_date,
      });

      console.log(`➕ INSERTED ${nik}`);
    }
  }

  // =========================
  // RESPONSE
  // =========================
  return {
    success: true,

    total: rows.length,

    inserted_count: insertedUsers.length,

    updated_count: updatedUsers.length,

    inserted_users: insertedUsers,

    updated_users: updatedUsers,
  };
}
