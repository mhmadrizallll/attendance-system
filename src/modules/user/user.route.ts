// user.route.ts

import express from "express";

import {
  getUserDetail,
  getUsers,
  updateUserController,
  deleteUserController,
  restoreUserController,
} from "./user.controller";

const router = express.Router();

// GET DETAIL
router.get("/:id", getUserDetail);

// GET USERS
router.get("/", getUsers);

// UPDATE USER
router.put("/:id", updateUserController);

// SOFT DELETE
router.delete("/:id", deleteUserController);

// ✅ RESTORE USER
router.patch("/:id/restore", restoreUserController);

export default router;
