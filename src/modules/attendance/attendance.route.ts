import { Router } from "express";
import { getAttendances, getSummary } from "./attendance.controller";

const router = Router();

router.get("/", getAttendances);
router.get("/summary", getSummary);

export default router;
