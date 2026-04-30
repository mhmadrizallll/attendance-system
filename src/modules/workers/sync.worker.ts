import db from "../../config/db";
import { syncDevice } from "../device/device.service";
import { syncUsersFromDevice } from "../device/device.user.service";

export async function syncAllDevices() {
  const devices = await db("devices");

  for (const device of devices) {
    try {
      console.log(`\n🔄 SYNC DEVICE: ${device.ip_address}`);

      // 🔥 1. sync user dulu
      await syncUsersFromDevice(device);

      // 🔥 2. sync attendance
      await syncDevice(device);
    } catch (err) {
      console.error("SYNC DEVICE ERROR:", device.ip_address, err);
    }
  }
}
