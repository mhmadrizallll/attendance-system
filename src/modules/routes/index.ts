import { Router } from "express";
import userRoute from "../user/user.route";
import deviceRoutes from "../device/device.route";
import itReportServerRoutes from "../report/it-report-server.route";
import itReportRoutes from "../report/it-report.route";
import attendanceRoutes from "../attendance/attendance.route";
import departmentRoutes from "../departement/departement.route";
import importRoutes from "../import/import.route";

const router = Router();

router.use("/users", userRoute);
router.use("/devices", deviceRoutes);
router.use("/send-it-report-server", itReportServerRoutes);
router.use("/send-it-report", itReportRoutes);
router.use("/attendances", attendanceRoutes);
router.use("/departments", departmentRoutes);
router.use("/import", importRoutes);

export default router;
