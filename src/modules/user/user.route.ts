// src/modules/users/user.routes.ts

import { Router } from "express";

import {
  createUserController,
  getUsersController,
  getUserDetailController,
  updateUserController,
  deleteUserController,
  restoreUserController,
} from "./user.controller";

import { authMiddleware } from "../middlewares/auth";

const router = Router();

// =========================
// CREATE USER
// =========================
router.post("/", authMiddleware, createUserController);

// =========================
// GET USERS
// =========================
router.get("/", authMiddleware, getUsersController);

// =========================
// GET USER DETAIL
// =========================
router.get("/:id", authMiddleware, getUserDetailController);

// =========================
// UPDATE USER
// =========================
router.put("/:id", authMiddleware, updateUserController);

// =========================
// DELETE USER
// =========================
router.delete("/:id", authMiddleware, deleteUserController);

// =========================
// RESTORE USER
// =========================
router.patch("/restore/:id", authMiddleware, restoreUserController);

export default router;
