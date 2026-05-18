// probation.route.ts
import express from "express";

import {
  getProbationReminderUsersController,
  sendProbationReminderController,
} from "./probation.controller";

import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

router.get(
  "/reminder-users",
  authMiddleware,
  getProbationReminderUsersController,
);

router.post("/send-reminder", authMiddleware, sendProbationReminderController);

export default router;
