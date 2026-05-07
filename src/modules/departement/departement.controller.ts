import { Request, Response } from "express";
import { getDepartmentsService } from "./departement.service";

export async function getDepartments(req: Request, res: Response) {
  try {
    const data = await getDepartmentsService();

    res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
}
