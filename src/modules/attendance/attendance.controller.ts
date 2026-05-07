import { Request, Response } from "express";

import {
  getAttendancesService,
  getSummaryService,
  getAttendanceByDate,
  getSummaryByDate,
  getAttendanceByDateAndDept,
  getSummaryByFilters,
  getAttendanceByFilters,
} from "./attendance.service";

export async function getAttendances(req: Request, res: Response) {
  try {
    const data = await getAttendancesService(req.query);

    res.json(data);
  } catch (err: any) {
    console.error("GET ATTENDANCES ERROR:", err);

    res.status(500).json({
      message: err.message,
      error: err,
    });
  }
}

export async function getSummary(req: Request, res: Response) {
  try {
    const data = await getSummaryService();

    res.json(data);
  } catch (err: any) {
    console.error("GET SUMMARY ERROR:", err);

    res.status(500).json({
      message: err.message,
      error: err,
    });
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

    return res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error("GET BY DATE ERROR:", err);

    return res.status(500).json({
      message: err.message,
      error: err,
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

    return res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error("GET SUMMARY DATE ERROR:", err);

    return res.status(500).json({
      message: err.message,
      error: err,
    });
  }
}

export async function getByDateAndDept(req: Request, res: Response) {
  try {
    const { date, dept } = req.query;

    if (!date) {
      return res.status(400).json({
        message: "date is required",
      });
    }

    const data = await getAttendanceByDateAndDept(
      date as string,
      dept as string,
    );

    return res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error("GET DATE DEPT ERROR:", err);

    return res.status(500).json({
      message: err.message,
      error: err,
    });
  }
}

export async function getByFilters(req: Request, res: Response) {
  try {
    console.log("REQ QUERY:", req.query);

    const data = await getAttendanceByFilters(req.query);

    const summary = await getSummaryByFilters(req.query);

    return res.json({
      success: true,
      data,
      summary,
    });
  } catch (err: any) {
    console.error("GET FILTER ERROR:", err);

    return res.status(500).json({
      message: err.message,
      error: err,
    });
  }
}
