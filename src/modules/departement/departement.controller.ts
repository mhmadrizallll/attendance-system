import { Request, Response } from "express";

import { getDepartmentsService } from "./departement.service";

export async function getDepartments(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    const data = await getDepartmentsService(user);

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
