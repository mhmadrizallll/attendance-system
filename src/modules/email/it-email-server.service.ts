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

export async function sendItReport(
  data: Attendance[],
  toEmails: string[],
  date: string,
): Promise<void> {
  if (!date) {
    throw new Error("Date is required");
  }

  console.log("📊 DATA LENGTH:", data.length);
  console.log("📅 REPORT DATE:", date);

  // =========================
  // ✅ SORT BY TIME ONLY
  // =========================
  data.sort((a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  // =========================
  // REPORT DATE
  // =========================
  const reportDate = new Date(date + "T00:00:00").toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // =========================
  // CREATE EXCEL
  // =========================
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("IT Report");

  sheet.columns = [
    { header: "Nama", key: "name", width: 30 },
    { header: "NIK", key: "device_user_id", width: 25 },
    { header: "Waktu", key: "timestamp", width: 30 },
  ];

  sheet.views = [{ state: "frozen", ySplit: 1 }];

  // HEADER STYLE
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F81BD" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  sheet.autoFilter = {
    from: "A1",
    to: "C1",
  };

  // =========================
  // INSERT DATA
  // =========================
  data.forEach((d) => {
    const dateObj = d.timestamp ? new Date(d.timestamp) : null;

    const row = sheet.addRow({
      name: d.name ?? "-",
      device_user_id: d.device_user_id ?? "-",
      timestamp: dateObj
        ? dateObj.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
        : "-",
    });

    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      cell.alignment = {
        vertical: "middle",
        horizontal: "left",
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  // =========================
  // HTML EMAIL
  // =========================
  const html = `
  <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
    <div style="max-width:800px; margin:auto; background:#ffffff; border:1px solid #e0e0e0; border-radius:8px; padding:20px;">

      <div style="text-align:center; padding-bottom:15px; border-bottom:3px solid #4f81bd; margin-bottom:20px;">
        <div style="font-size:22px; font-weight:bold; color:#2c3e50;">
          IT REPORT ENTER ON SERVER
        </div>

        <div style="font-size:14px; color:#7f8c8d; margin-top:5px;">
          ${reportDate}
        </div>    
      </div>

      <table style="width:100%; border-collapse:collapse; text-align:center;">
        <thead>
          <tr style="background:#4f81bd; color:#fff;">
            <th style="padding:10px; border:1px solid #ddd;">Nama</th>
            <th style="padding:10px; border:1px solid #ddd;">NIK</th>
            <th style="padding:10px; border:1px solid #ddd;">Tanggal</th>
            <th style="padding:10px; border:1px solid #ddd;">Waktu</th>
          </tr>
        </thead>

        <tbody>
          ${
            data.length > 0
              ? data
                  .map((d) => {
                    const dateObj = d.timestamp ? new Date(d.timestamp) : null;

                    return `
                      <tr>
                        <td style="padding:10px; border:1px solid #ddd;">${d.name ?? "-"}</td>
                        <td style="padding:10px; border:1px solid #ddd;">${d.device_user_id ?? "-"}</td>
                        <td style="padding:10px; border:1px solid #ddd;">
                          ${
                            dateObj
                              ? dateObj.toLocaleDateString("id-ID", {
                                  timeZone: "Asia/Jakarta",
                                })
                              : "-"
                          }
                        </td>
                        <td style="padding:10px; border:1px solid #ddd;">
                          ${
                            dateObj
                              ? dateObj.toLocaleTimeString("id-ID", {
                                  timeZone: "Asia/Jakarta",
                                })
                              : "-"
                          }
                        </td>
                      </tr>
                    `;
                  })
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
    // to: ["it.rizal@pt-longwell.com"],
    to: toEmails,
    cc: ["weitse.hung@pt-richshoes.com"],
    subject: `Daily IT Report Server - ${reportDate}`,
    html,
    attachments: [
      {
        filename: `it-report-${date}.xlsx`,
        content: buffer,
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
  });

  console.log("📧 EMAIL + EXCEL SENT SUCCESS");
}
