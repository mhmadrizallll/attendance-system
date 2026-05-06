import { Request, Response } from "express";
import {
  getAttendancesService,
  getSummaryService,
  getAttendanceByDate,
  getSummaryByDate,
  getAttendanceByDateAndDept,
} from "./attendance.service";

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

export async function getByDate(req: Request, res: Response) {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        message: "date is required",
      });
    }

    const data = await getAttendanceByDate(date as string);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function getSummaryDate(req: Request, res: Response) {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        message: "date is required",
      });
    }

    const data = await getSummaryByDate(date as string);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function getByDateAndDept(req: Request, res: Response) {
  try {
    const { date, dept } = req.query;

    if (!date) {
      return res.status(400).json({ message: "date is required" });
    }

    const data = await getAttendanceByDateAndDept(
      date as string,
      dept as string,
    );

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({ message: "error" });
  }
}
