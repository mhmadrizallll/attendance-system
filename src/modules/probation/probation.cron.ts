// src/modules/probation/probation.cron.ts

import cron from "node-cron";

import nodemailer from "nodemailer";

import db from "../../config/db";

// =========================
// MAIL CONFIG
// =========================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,

  port: Number(process.env.SMTP_PORT),

  secure: false,

  auth: {
    user: process.env.SMTP_USER,

    pass: process.env.SMTP_PASS,
  },
});

// =========================
// CHECK PROBATION USERS
// =========================
async function checkProbationUsers() {
  try {
    console.log("🔍 CHECKING PROBATION USERS...");

    // =========================
    // GET USERS
    // =========================
    const users = await db("users")
      .whereNull("deleted_at")

      // STATUS PROBATION
      .whereILike("status", "%Probation%")

      // BELUM PERNAH DIKIRIM EMAIL
      .where("probation_notified", false)

      // TEPAT 2 BULAN DARI START DATE
      .whereRaw(
        `
        CURRENT_DATE = DATE(start_date + INTERVAL '2 month')
      `,
      )

      .select(
        "id",
        "device_user_id",
        "name",
        "department",
        "status",
        "start_date",
      );

    // =========================
    // NO USER
    // =========================
    if (users.length === 0) {
      console.log("✅ NO PROBATION USER");

      return;
    }

    console.log(`📨 FOUND ${users.length} USER`);

    // =========================
    // GENERATE HTML ROWS
    // =========================
    const rows = users
      .map(
        (u, i) => `
          <tr>
            <td>${i + 1}</td>

            <td>${u.device_user_id}</td>

            <td>${u.name}</td>

            <td>${u.department || "-"}</td>

            <td>${u.status || "-"}</td>

            <td>
              ${new Date(u.start_date).toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </td>
          </tr>
        `,
      )
      .join("");

    // =========================
    // SEND EMAIL
    // =========================
    await transporter.sendMail({
      from: `"Attendance System" <${process.env.SMTP_USER}>`,

      to: [
        "it.rizal@pt-longwell.com",
        // "hrd@company.com",
      ],

      subject: "Probation Employee Evaluation Reminder",

      html: `
        <div style="font-family: Arial;">

          <h2>
            Probation Evaluation Reminder
          </h2>

          <p>
            Berikut daftar employee yang memasuki masa evaluasi probation:
          </p>

          <table
            border="1"
            cellpadding="8"
            cellspacing="0"
            style="border-collapse: collapse;"
          >
            <thead>
              <tr>
                <th>No</th>
                <th>NIK</th>
                <th>Name</th>
                <th>Department</th>
                <th>Status</th>
                <th>Start Date</th>
              </tr>
            </thead>

            <tbody>
              ${rows}
            </tbody>
          </table>

          <br />

          <p>
            Mohon dilakukan penilaian untuk menentukan
            kelanjutan employment employee terkait.
          </p>

        </div>
      `,
    });

    console.log("✅ EMAIL SENT");

    // =========================
    // UPDATE NOTIFIED
    // =========================
    await db("users")
      .whereIn(
        "id",
        users.map((u) => u.id),
      )

      .update({
        probation_notified: true,
      });

    console.log("✅ USERS UPDATED");
  } catch (err) {
    console.error("❌ PROBATION CRON ERROR:", err);
  }
}

// =========================
// RUN EVERY DAY 08:00
// =========================
cron.schedule("0 8 * * *", async () => {
  await checkProbationUsers();
});

console.log("🕒 PROBATION CRON RUNNING...");
