import express from "express";
import {
  getUserDetail,
  getUsers,
  updateUserController,
} from "./user.controller";

const router = express.Router();

router.get("/:id", getUserDetail);
router.get("/", getUsers);
router.put("/:id", updateUserController);

export default router;
