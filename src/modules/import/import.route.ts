import express from "express";

import { upload } from "../multer/upload";

import { importUsersController } from "./import.controller";

const router = express.Router();

router.post("/", upload.single("file"), importUsersController);

export default router;
