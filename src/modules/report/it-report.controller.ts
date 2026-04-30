import { sendItReportByDate } from "./it-report.service";
import { Request, Response } from "express";

export async function sendItReportController(req: Request, res: Response) {
  const { date } = req.query;

  await sendItReportByDate({ date });

  res.json({ message: "IT Report Attendance sent" });
}
