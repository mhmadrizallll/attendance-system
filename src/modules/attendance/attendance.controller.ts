import { Request, Response } from "express";
import { getAttendancesService, getSummaryService } from "./attendance.service";

export async function getAttendances(req: Request, res: Response) {
  try {
    const data = await getAttendancesService(req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetch attendances" });
  }
}

export async function getSummary(req: Request, res: Response) {
  try {
    const data = await getSummaryService();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetch summary" });
  }
}
