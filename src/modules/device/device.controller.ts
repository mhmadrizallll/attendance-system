import { Request, Response } from "express";
import db from "../../config/db";

export async function addDevice(req: Request, res: Response) {
  const { name, ip_address, port, location } = req.body;

  const device = await db("devices")
    .insert({ name, ip_address, port, location })
    .returning("*");

  res.json(device);
}
