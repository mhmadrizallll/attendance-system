import { sendReportByDate } from "./it-report-server.service";
import { Request, Response } from "express";

export async function sendReportController(req: Request, res: Response) {
  try {
    const { date, start_date, end_date } = req.query;

    const start = String(start_date || date || "");
    const end = String(end_date || start_date || date || "");

    if (!start) {
      return res.status(400).json({
        message: "Tanggal wajib diisi",
      });
    }

    await sendReportByDate({
      start_date: start,
      end_date: end,
    });

    return res.json({
      message: "IT Server Report sent successfully",
      start_date: start,
      end_date: end,
    });
  } catch (err) {
    console.error("❌ CONTROLLER ERROR:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
