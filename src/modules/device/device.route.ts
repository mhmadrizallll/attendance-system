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

const router = Router();

router.post("/", addDevice);

router.get("/sync-now", async (req, res) => {
  const devices = await db("devices");

  for (const device of devices) {
    await syncDevice(device);
  }

  res.json({ message: "sync done" });
});

router.get("/", getDevicesController);
router.post("/", createDeviceController);

router.put("/:id", updateDeviceController);

router.delete("/:id", deleteDeviceController);

export default router;
