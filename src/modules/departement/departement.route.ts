import { Router } from "express";
import { getDepartments } from "./departement.controller";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.get("/", authMiddleware, getDepartments);

export default router;
