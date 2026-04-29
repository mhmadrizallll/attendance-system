import express from "express";
import { getUserDetail } from "./user.controller";

const router = express.Router();

router.get("/:id", getUserDetail);

export default router;
