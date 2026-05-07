import { Router } from "express";
import { getDepartments } from "./departement.controller";

const router = Router();

router.get("/", getDepartments);

export default router;
