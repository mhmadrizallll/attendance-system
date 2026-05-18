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

// GET
export async function getDevicesController(req: Request, res: Response) {
  try {
    const data = await getDevices(req.user);

    res.json({ data });
  } catch (err: any) {
    console.error(err);

    res.status(403).json({
      message: err.message || "Access denied",
    });
  }
}

// CREATE
export async function createDeviceController(req: Request, res: Response) {
  try {
    const data = await createDevice(req.body, req.user);

    res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error(err);

    res.status(403).json({
      message: err.message || "Failed create device",
    });
  }
}

// UPDATE
export async function updateDeviceController(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };

    const data = await updateDevice(id, req.body, req.user);

    res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error(err);

    res.status(403).json({
      message: err.message || "Failed update device",
    });
  }
}

// DELETE
export async function deleteDeviceController(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };

    await deleteDevice(id, req.user);

    res.json({
      success: true,
    });
  } catch (err: any) {
    console.error(err);

    res.status(403).json({
      message: err.message || "Failed delete device",
    });
  }
}
