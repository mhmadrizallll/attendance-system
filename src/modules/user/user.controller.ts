import { Request, Response } from "express";

import {
  getUserWithAttendances,
  getUsersService,
  updateUser,
  deleteUser,
  restoreUser,
} from "./user.service";

// =========================
// GET DETAIL USER + LOGS
// =========================
export async function getUserDetail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // ✅ USER LOGIN DARI JWT
    const loginUser = (req as any).user;

    const data = await getUserWithAttendances(Number(id), loginUser);

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

// =========================
// GET USERS
// =========================
export async function getUsers(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    const data = await getUsersService(req.query, user);

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

// =========================
// UPDATE USER
// =========================
export async function updateUserController(req: Request, res: Response) {
  try {
    const { id } = req.params as {
      id: string;
    };

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

// =========================
// SOFT DELETE USER
// =========================
export async function deleteUserController(req: Request, res: Response) {
  try {
    const { id } = req.params as {
      id: string;
    };

    await deleteUser(id);

    res.json({
      success: true,
      message: "User deactivated",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed delete user",
    });
  }
}

// =========================
// RESTORE USER
// =========================
export async function restoreUserController(req: Request, res: Response) {
  try {
    const { id } = req.params as {
      id: string;
    };

    const user = await restoreUser(id);

    res.json({
      success: true,
      message: "User restored",
      data: user,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed restore user",
    });
  }
}
