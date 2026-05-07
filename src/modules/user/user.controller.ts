import { Request, Response } from "express";
import {
  getUserWithAttendances,
  getUsersService,
  updateUser,
} from "./user.service";

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

export async function getUsers(req: Request, res: Response) {
  try {
    const data = await getUsersService(req.query);

    return res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error("GET USERS ERROR:", err);

    return res.status(500).json({
      message: err.message,
    });
  }
}

export async function updateUserController(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };

    const user = await updateUser(id, req.body);

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed update user",
    });
  }
}
