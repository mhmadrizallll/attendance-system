import { Router } from "express";
import {
  getAttendances,
  getSummary,
  // getByDate,
  // getSummaryDate,
  getByDateAndDept,
  getByFilters,
} from "./attendance.controller";

import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/", getAttendances);
router.get("/summary", authMiddleware, getSummary);
router.get("/by-date-and-dept", authMiddleware, getByDateAndDept);
router.get("/by-filters", authMiddleware, getByFilters);

export default router;
