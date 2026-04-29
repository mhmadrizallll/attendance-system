import db from "../../config/db";
import { syncUsersFromDevice } from "../device/device.user.service";

export async function syncUsersOnly() {
  const devices = await db("devices");

  await Promise.all(devices.map((device) => syncUsersFromDevice(device)));
}
