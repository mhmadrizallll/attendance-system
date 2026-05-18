import { Request, Response } from "express";

import {
  getAttendancesService,
  // getSummaryService,
  // getAttendanceByDate,
  // getSummaryByDate,
  getAttendanceByDateAndDept,
  getSummaryByFilters,
  getAttendanceByFilters,
} from "./attendance.service";

export async function getAttendances(req: any, res: Response) {
  try {
    const user = req.user; // 🔥 penting

    const data = await getAttendancesService(req.query, user);

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
    const user = req.user;

    const { date, dept, device_id } = req.query;

    console.log("========== SUMMARY DEBUG ==========");
    console.log("REQ USER:", user);
    console.log("ROLE:", user?.role);
    console.log("QUERY:", req.query);
    console.log("===================================");

    const data = await getSummaryByFilters(
      {
        date: date as string,
        dept: dept as string,
        device_id: device_id as string,
      },
      user,
    );

    console.log("SUMMARY RESULT:", data);
    console.log("===================================");

    return res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error("❌ CONTROLLER ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

export async function getByDateAndDept(req: Request, res: Response) {
  try {
    const user = req.user;

    const { date, dept } = req.query;

    if (!date) {
      return res.status(400).json({
        message: "date is required",
      });
    }

    const data = await getAttendanceByDateAndDept(
      date as string,
      dept as string,
      user, // 🔥 penting
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
    const user = req.user;

    const data = await getAttendanceByFilters(req.query, user);

    return res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    return res.status(500).json({
      message: err.message,
    });
  }
}
