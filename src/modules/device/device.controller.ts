import { Request, Response } from "express";
import db from "../../config/db";
import {
  getDevices,
  createDevice,
  deleteDevice,
  updateDevice,
} from "./device.service";

export async function addDevice(req: Request, res: Response) {
  const { name, ip_address, port, location } = req.body;

  const device = await db("devices")
    .insert({ name, ip_address, port, location })
    .returning("*");

  res.json(device);
}

export async function getDevicesController(req: Request, res: Response) {
  try {
    const data = await getDevices();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: "error" });
  }
}

// CREATE
export async function createDeviceController(req: Request, res: Response) {
  try {
    const data = await createDevice(req.body);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed create device",
    });
  }
}

// UPDATE
export async function updateDeviceController(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };

    const data = await updateDevice(id, req.body);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed update device",
    });
  }
}

// DELETE
export async function deleteDeviceController(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };

    await deleteDevice(id);

    res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed delete device",
    });
  }
}
