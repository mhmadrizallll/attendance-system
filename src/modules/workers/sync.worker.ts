import db from "../../config/db";
import { syncDevice } from "../device/device.service";
import { syncUsersFromDevice } from "../device/device.user.service";

export async function syncAllDevices() {
  const devices = await db("devices");

  await Promise.all(
    devices.map(async (device) => {
      // 🔥 1. sync user dulu
      await syncUsersFromDevice(device);

      // 🔥 2. baru sync attendance
      await syncDevice(device);
    }),
  );
}
