import { Request, Response } from "express";
import db from "../../config/db";
import { getDevices } from "./device.service";

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
