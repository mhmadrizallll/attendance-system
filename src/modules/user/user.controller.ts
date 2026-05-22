// src/modules/users/user.controller.ts

import {
  createUserService,
  getUsersService,
  getUserWithAttendances,
  updateUser,
  deleteUser,
  restoreUser,
} from "./user.service";

// =========================
// CREATE USER
// =========================
export async function createUserController(req: any, res: any) {
  try {
    const result = await createUserService(req.body, req.user);

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// =========================
// GET USERS
// =========================
export async function getUsersController(req: any, res: any) {
  try {
    const result = await getUsersService(req.query, req.user);

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// =========================
// GET USER DETAIL
// =========================
export async function getUserDetailController(req: any, res: any) {
  try {
    const result = await getUserWithAttendances(
      Number(req.params.id),
      req.user,
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// =========================
// UPDATE USER
// =========================
export async function updateUserController(req: any, res: any) {
  try {
    const result = await updateUser(req.params.id, req.body);

    return res.json({
      success: true,
      message: "User updated successfully",
      data: result,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// =========================
// DELETE USER
// =========================
export async function deleteUserController(req: any, res: any) {
  try {
    await deleteUser(req.params.id);

    return res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// =========================
// RESTORE USER
// =========================
export async function restoreUserController(req: any, res: any) {
  try {
    const result = await restoreUser(req.params.id);

    return res.json({
      success: true,
      message: "User restored successfully",
      data: result,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
