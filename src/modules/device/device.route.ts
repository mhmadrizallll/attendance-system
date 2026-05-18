import { Router } from "express";
import {
  addDevice,
  getDevicesController,
  createDeviceController,
  updateDeviceController,
  deleteDeviceController,
} from "./device.controller";
import db from "../../config/db";
import { syncDevice } from "./device.service";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.post("/", authMiddleware, addDevice);

router.get("/sync-now", async (req, res) => {
  const devices = await db("devices");

  for (const device of devices) {
    await syncDevice(device);
  }

  res.json({ message: "sync done" });
});

router.get("/", authMiddleware, getDevicesController);
router.post("/", authMiddleware, createDeviceController);

router.put("/:id", authMiddleware, updateDeviceController);

router.delete("/:id", authMiddleware, deleteDeviceController);

export default router;
