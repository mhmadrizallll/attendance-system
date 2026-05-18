import express from "express";
import { sendItReportController } from "./it-report.controller";
import { authMiddleware } from "../middlewares/auth";
import { superadminMiddleware } from "../middlewares/superadminMiddleware";

const router = express.Router();

router.get("/", authMiddleware, superadminMiddleware, sendItReportController);

export default router;
