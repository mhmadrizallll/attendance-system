import express from "express";
import { sendItReportController } from "./it-report.controller";

const router = express.Router();

router.get("/", sendItReportController);

export default router;
