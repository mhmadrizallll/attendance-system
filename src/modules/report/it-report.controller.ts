import { sendItReportByDate } from "./it-report.service";
import { Request, Response } from "express";

export async function sendItReportController(req: Request, res: Response) {
  try {
    const { start_date, end_date } = req.query;

    await sendItReportByDate({
      start_date: String(start_date || ""),
      end_date: String(end_date || ""),
    });

    return res.json({
      message: "IT Report Attendance sent",
    });
  } catch (error) {
    console.error("SEND IT REPORT ERROR:", error);

    return res.status(500).json({
      message: "Failed to send IT Report",
    });
  }
}
