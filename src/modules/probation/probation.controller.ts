// probation.controller.ts

import { Request, Response } from "express";

import nodemailer from "nodemailer";

import db from "../../config/db";

import { getProbationReminderUsers } from "./probation.service";

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
// GET USERS
// =========================
export async function getProbationReminderUsersController(
  req: Request,
  res: Response,
) {
  try {
    const users = await getProbationReminderUsers();

    res.json({
      success: true,
      total: users.length,
      users,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// =========================
// SEND REMINDER EMAIL
// =========================
export async function sendProbationReminderController(
  req: Request,
  res: Response,
) {
  try {
    // =========================
    // GET USERS
    // =========================
    const users = await getProbationReminderUsers();

    // =========================
    // EMPTY
    // =========================
    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No probation users",
      });
    }

    // =========================
    // GENERATE TABLE ROWS
    // =========================
    const rows = users
      .map(
        (u: any, i: number) => `
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
        "it.lintang@pt-longwell.com",
        // "hrd@company.com",
      ],

      subject: "Probation Employee Evaluation Reminder",

      html: `
        <div style="font-family: Arial;">

          <h2>
            Probation Evaluation Reminder
          </h2>

          <p>
            Berikut daftar employee yang probationnya akan berakhir 1 bulan lagi:
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
            Mohon dilakukan evaluasi employee terkait.
          </p>

        </div>
      `,
    });

    // =========================
    // UPDATE NOTIFIED
    // =========================
    await db("users")
      .whereIn(
        "id",
        users.map((u: any) => u.id),
      )

      .update({
        probation_notified: true,
      });

    // =========================
    // SUCCESS
    // =========================
    res.json({
      success: true,
      message: "Reminder email sent",
      total: users.length,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed send reminder",
    });
  }
}
