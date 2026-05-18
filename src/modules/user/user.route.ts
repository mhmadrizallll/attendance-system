import express from "express";

import {
  getUserDetail,
  getUsers,
  updateUserController,
  deleteUserController,
  restoreUserController,
} from "./user.controller";

import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

// ✅ PROTECTED ROUTES
router.get("/", authMiddleware, getUsers);

router.get("/:id", authMiddleware, getUserDetail);

router.put("/:id", authMiddleware, updateUserController);

router.delete("/:id", authMiddleware, deleteUserController);

router.patch("/:id/restore", authMiddleware, restoreUserController);

export default router;
