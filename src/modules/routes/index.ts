import { Router } from "express";
import userRoute from "../user/user.route";
import deviceRoutes from "../device/device.route";
import itReportServerRoutes from "../report/it-report-server.route";
import itReportRoutes from "../report/it-report.route";
import attendanceRoutes from "../attendance/attendance.route";

const router = Router();

router.use("/users", userRoute);
router.use("/devices", deviceRoutes);
router.use("/send-it-report-server", itReportServerRoutes);
router.use("/send-it-report", itReportRoutes);
router.use("/attendances", attendanceRoutes);

export default router;
