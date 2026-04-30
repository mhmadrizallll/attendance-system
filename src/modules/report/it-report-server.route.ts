import express from "express";
import { sendReportController } from "./it-report-server.controller";

const router = express.Router();

router.get("/", sendReportController);

export default router;
