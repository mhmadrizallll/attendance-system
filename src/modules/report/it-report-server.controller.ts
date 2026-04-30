import { sendReportByDate } from "./it-report-server.service";
import { Request, Response } from "express";

export async function sendReportController(req: Request, res: Response) {
  try {
    const { date, deviceId } = req.query;

    if (!date) {
      return res.status(400).json({
        message: "date required (format: YYYY-MM-DD)",
      });
    }

    await sendReportByDate({
      date,
      deviceId: Number(deviceId) || 1,
    });

    return res.json({
      message: "IT Server Report sent successfully",
      date,
    });
  } catch (err) {
    console.error("❌ CONTROLLER ERROR:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
