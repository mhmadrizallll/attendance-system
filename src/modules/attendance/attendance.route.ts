import { Router } from "express";
import {
  getAttendances,
  getSummary,
  getByDate,
  getSummaryDate,
  getByDateAndDept,
} from "./attendance.controller";

const router = Router();

router.get("/", getAttendances);
router.get("/summary", getSummary);
router.get("/by-date", getByDate);
router.get("/summary-by-date", getSummaryDate);
router.get("/by-date-and-dept", getByDateAndDept);

export default router;
