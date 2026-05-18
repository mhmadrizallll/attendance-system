import express from "express";
import { sendReportController } from "./it-report-server.controller";
import { authMiddleware } from "../middlewares/auth";
import { superadminMiddleware } from "../middlewares/superadminMiddleware";

const router = express.Router();

router.get("/", authMiddleware, superadminMiddleware, sendReportController);

export default router;
