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

function formatPeriod(period: string) {
  // RANGE
  if (period.includes("s/d")) {
    const [start, end] = period.split("s/d").map((x) => x.trim());

    const startText = new Date(`${start}T00:00:00`).toLocaleDateString(
      "id-ID",
      {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "long",
        year: "numeric",
      },
    );

    const endText = new Date(`${end}T00:00:00`).toLocaleDateString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    return `${startText} s/d ${endText}`;
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

export async function sendItReport(
  data: Attendance[],
  toEmails: string[],
  date: string,
): Promise<void> {
  if (!date) {
    throw new Error("Date is required");
  }

  console.log("📊 DATA LENGTH:", data.length);
  console.log("📅 REPORT PERIOD:", date);

  // =========================
  // SORT BY TIME ASC
  // =========================
  data.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const reportDate = formatPeriod(date);

  // =========================
  // HELPERS
  // =========================
  const formatDate = (d?: Date) =>
    d
      ? new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(d)
      : "-";

  const formatTime = (d?: Date) =>
    d
      ? new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(d)
      : "-";

  // =========================
  // EXCEL
  // =========================
  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet("IT Report Server");

  sheet.columns = [
    { header: "Nama", key: "name", width: 35 },
    { header: "NIK", key: "device_user_id", width: 20 },
    { header: "Tanggal", key: "date", width: 20 },
    { header: "Waktu", key: "time", width: 20 },
  ];

  sheet.views = [{ state: "frozen", ySplit: 1 }];

  sheet.autoFilter = {
    from: "A1",
    to: "D1",
  };

  const headerRow = sheet.getRow(1);

  headerRow.eachCell((cell) => {
    cell.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
    };

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

  data.forEach((item) => {
    const dateObj = new Date(item.timestamp);

    sheet.addRow({
      name: item.name ?? "-",
      device_user_id: item.device_user_id ?? "-",
      date: formatDate(dateObj),
      time: formatTime(dateObj),
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  // =========================
  // HTML EMAIL
  // =========================
  const html = `
  <div style="font-family:Arial,sans-serif;background:#f4f6f8;padding:20px;">
    <div style="max-width:900px;margin:auto;background:#fff;padding:20px;border-radius:8px;">

      <div style="text-align:center;border-bottom:3px solid #4f81bd;padding-bottom:15px;margin-bottom:20px;">
        <h2 style="margin:0;color:#2c3e50;">
          IT REPORT ENTER ON SERVER
        </h2>

        <div style="margin-top:8px;color:#666;">
          ${reportDate}
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
            <th style="padding:10px;border:1px solid #ddd;">Nama</th>
            <th style="padding:10px;border:1px solid #ddd;">NIK</th>
            <th style="padding:10px;border:1px solid #ddd;">Tanggal</th>
            <th style="padding:10px;border:1px solid #ddd;">Waktu</th>
          </tr>
        </thead>

        <tbody>
          ${
            data.length
              ? data
                  .map((item) => {
                    const dateObj = new Date(item.timestamp);

                    return `
                      <tr>
                        <td style="padding:8px;border:1px solid #ddd;">
                          ${item.name}
                        </td>

                        <td style="padding:8px;border:1px solid #ddd;">
                          ${item.device_user_id}
                        </td>

                        <td style="padding:8px;border:1px solid #ddd;">
                          ${formatDate(dateObj)}
                        </td>

                        <td style="padding:8px;border:1px solid #ddd;">
                          ${formatTime(dateObj)}
                        </td>
                      </tr>
                    `;
                  })
                  .join("")
              : `
                <tr>
                  <td colspan="4"
                      style="padding:15px;border:1px solid #ddd;color:red;">
                    Tidak ada aktivitas
                  </td>
                </tr>
              `
          }
        </tbody>
      </table>

      <div
        style="
          text-align:center;
          margin-top:20px;
          color:#999;
          font-size:12px;
        "
      >
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

    // production
    // to: toEmails,

    // testing
    to: ["it.rizal@pt-longwell.com"],

    subject: `IT Server Attendance Report (${reportDate})`,

    html,

    attachments: [
      {
        filename: `it-server-report-${Date.now()}.xlsx`,
        content: buffer,
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
  });

  console.log("📧 IT SERVER REPORT SENT");
}
