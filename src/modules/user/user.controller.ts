import { Request, Response } from "express";
import { getUserWithAttendances } from "./user.service";

export async function getUserDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const data = await getUserWithAttendances(Number(id));

    if (!data) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
