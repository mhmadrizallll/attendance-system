import nodemailer from "nodemailer";
import ExcelJS from "exceljs";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

type Attendance = {
  name: string;
  device_user_id: string;
  timestamp: Date;
};

type ProcessedAttendance = {
  name: string;
  device_user_id: string;
  checkIn?: Date;
  checkOut?: Date;
};

// =========================
// FORMAT PERIOD (IMPORTANT)
// =========================
function formatPeriod(period: string) {
  // RANGE
  if (period.includes("s/d")) {
    const [start, end] = period.split("s/d").map((x) => x.trim());

    const startFormatted = new Date(`${start}T00:00:00`).toLocaleDateString(
      "id-ID",
      {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "long",
        year: "numeric",
      },
    );

    const endFormatted = new Date(`${end}T00:00:00`).toLocaleDateString(
      "id-ID",
      {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "long",
        year: "numeric",
      },
    );

    return `${startFormatted} s/d ${endFormatted}`;
  }

  // SINGLE DATE
  return new Date(`${period}T00:00:00`).toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// =========================
// MAIN FUNCTION
// =========================
export async function sendItReport(
  data: Attendance[],
  toEmails: string[],
  period: string,
): Promise<void> {
  if (!period) {
    throw new Error("Period is required");
  }

  console.log("📊 RAW DATA:", data.length);
  console.log("📅 PERIOD:", period);

  // =========================
  // SORT
  // =========================
  data.sort((a, b) => {
    const userCompare = a.device_user_id.localeCompare(b.device_user_id);
    if (userCompare === 0) {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    }
    return userCompare;
  });

  // =========================
  // GROUPING
  // =========================
  const processedMap = new Map<string, ProcessedAttendance>();

  data.forEach((d) => {
    const dateObj = new Date(d.timestamp);

    const hour = Number(
      dateObj.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        hour12: false,
      }),
    );

    const minute = Number(
      dateObj.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        minute: "2-digit",
      }),
    );

    const timeValue = hour * 60 + minute;
    const key = d.device_user_id;

    if (!processedMap.has(key)) {
      processedMap.set(key, {
        name: d.name,
        device_user_id: d.device_user_id,
      });
    }

    const user = processedMap.get(key)!;

    // IN (07:15 - 07:30)
    if (timeValue >= 435 && timeValue <= 450) {
      if (!user.checkIn || dateObj < user.checkIn) {
        user.checkIn = dateObj;
      }
    }

    // OUT (>= 16:30)
    if (timeValue >= 900) {
      if (!user.checkOut || dateObj > user.checkOut) {
        user.checkOut = dateObj;
      }
    }
  });

  const finalData = Array.from(processedMap.values());

  console.log("✅ CLEAN DATA:", finalData.length);

  // =========================
  // PERIOD FIX (INI YANG PENTING)
  // =========================
  const reportPeriod = formatPeriod(period);

  // =========================
  // EXCEL
  // =========================
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("IT Report");

  sheet.columns = [
    { header: "Nama", key: "name", width: 30 },
    { header: "NIK", key: "device_user_id", width: 25 },
    { header: "Masuk", key: "checkIn", width: 20 },
    { header: "Pulang", key: "checkOut", width: 20 },
  ];

  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F81BD" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
    };
  });

  // DATA
  finalData.forEach((d) => {
    sheet.addRow({
      name: d.name,
      device_user_id: d.device_user_id,
      checkIn: d.checkIn
        ? d.checkIn.toLocaleTimeString("id-ID", {
            timeZone: "Asia/Jakarta",
          })
        : "-",
      checkOut: d.checkOut
        ? d.checkOut.toLocaleTimeString("id-ID", {
            timeZone: "Asia/Jakarta",
          })
        : "-",
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  // =========================
  // EMAIL HTML
  // =========================
  const html = `
   <div style="font-family:Arial,sans-serif;background:#f4f6f8;padding:20px;">
    <div style="max-width:900px;margin:auto;background:#fff;padding:20px;border-radius:8px;">

      
      <div style="text-align:center;border-bottom:3px solid #4f81bd;padding-bottom:15px;margin-bottom:20px;">
        <h2 style="margin:0;color:#2c3e50;">
          IT REPORT ON ATTENDANCE
        </h2>

        <div style="margin-top:8px;color:#666;">
          ${reportPeriod}
        </div>
      </div>

      <table
        style="
          width:100%;
          border-collapse:collapse;
          text-align:center;
        "
      >
        <thead>
          <tr style="background:#4f81bd;color:white;">
            <th style="padding:10px; border:1px solid #ddd;">Nama</th>
            <th style="padding:10px; border:1px solid #ddd;">NIK</th>
            <th style="padding:10px; border:1px solid #ddd;">Masuk</th>
            <th style="padding:10px; border:1px solid #ddd;">Pulang</th>
          </tr>
        </thead>
        <tbody>
          ${
            finalData.length > 0
              ? finalData
                  .map(
                    (d) => `
              <tr>
                <td style="padding:10px; border:1px solid #ddd;">${d.name}</td>
                <td style="padding:10px; border:1px solid #ddd;">${d.device_user_id}</td>
                <td style="padding:10px; border:1px solid #ddd;">${
                  d.checkIn
                    ? d.checkIn.toLocaleTimeString("id-ID", {
                        timeZone: "Asia/Jakarta",
                      })
                    : "-"
                }</td>
                <td style="padding:10px; border:1px solid #ddd;">${
                  d.checkOut
                    ? d.checkOut.toLocaleTimeString("id-ID", {
                        timeZone: "Asia/Jakarta",
                      })
                    : "-"
                }</td>
              </tr>
            `,
                  )
                  .join("")
              : `
              <tr>
                <td colspan="4" style="padding:15px; border:1px solid #ddd; color:red;">
                  Tidak ada aktivitas (libur / tidak ada absen)
                </td>
              </tr>
            `
          }
        </tbody>
      </table>

      <div style="text-align:center; margin-top:20px; font-size:11px; color:#95a5a6;">
        Generated automatically by IT Software Dept
      </div>
    </div>
  </div>
  `;

  // =========================
  // SEND EMAIL
  // =========================
  await transporter.sendMail({
    from: `<${process.env.SMTP_USER}>`,
    to: ["it.rizal@pt-longwell.com"],
    subject: `IT Attendance Report (${reportPeriod})`,
    html,
    attachments: [
      {
        filename: `attendance-report-${Date.now()}.xlsx`,
        content: buffer,
      },
    ],
  });

  console.log("📧 EMAIL SENT SUCCESS");
}
