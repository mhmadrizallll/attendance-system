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
  const rawRows: any[] = XLSX.utils.sheet_to_json(sheet);

  // =========================
  // NORMALIZE HEADER
  // =========================
  const rows = rawRows.map((row) => {
    const newRow: any = {};

    Object.keys(row).forEach((key) => {
      // 🔥 AMBIL BAHASA INDONESIA SAJA
      const cleanKey = key
        .split("\r\n")[0] // ambil sebelum enter
        .trim();

      newRow[cleanKey] = row[key];
    });

    return newRow;
  });

  console.log("NORMALIZED ROW:", rows[0]);

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

    // ✅ SEKARANG SUDAH BERSIH
    const nik = String(row["Nik"] || "")
      .replace(".0", "")
      .trim();

    const name = String(row["Nama"] || "").trim();

    const department = String(row["Nama Bagian"] || "").trim();

    // SKIP HEADER PALSU
    if (nik === "Nik") {
      continue;
    }

    // SKIP EMPTY
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
          department,

          name: name || existingUser.name,
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
      });

      insertedUsers.push({
        device_user_id: nik,

        name,

        department,
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
