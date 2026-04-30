import ZKLib from "node-zklib";
import db from "../../config/db";
import { getIO } from "../../realtime/socket";

export async function syncDevice(device: any) {
  const zk = new ZKLib(device.ip_address, device.port, 10000, 4000);

  try {
    await zk.createSocket();

    const result = await zk.getAttendances();
    const rawLogs = result?.data || [];

    console.log("\n========================");
    console.log("DEVICE:", device.ip_address);
    console.log("TOTAL LOGS:", rawLogs.length);
    console.log("========================\n");

    const lastSyncTime = device.last_sync
      ? new Date(device.last_sync).getTime()
      : 0;

    let latestTime = lastSyncTime;
    let newCount = 0;

    const io = getIO(); // 🔥 AMBIL SEKALI (JANGAN DI LOOP)

    for (const log of rawLogs) {
      const uid = log.deviceUserId;
      const recordTime = log.recordTime;

      if (!uid || !recordTime) continue;

      const timestamp = new Date(recordTime).getTime();

      if (timestamp <= lastSyncTime) continue;

      newCount++;

      if (timestamp > latestTime) {
        latestTime = timestamp;
      }

      // 👤 FIND OR CREATE USER
      let user = await db("users").where({ device_user_id: uid }).first();

      if (!user) {
        const [newUser] = await db("users")
          .insert({
            device_user_id: uid,
            name: `User ${uid}`,
          })
          .returning("*");

        user = newUser;
      }

      // 💾 INSERT ATTENDANCE
      await db("attendances")
        .insert({
          device_id: device.id,
          user_id: user.id,
          device_user_id: uid,
          timestamp: new Date(recordTime),
          type: "check",
        })
        .onConflict(["device_id", "device_user_id", "timestamp"])
        .ignore();

      // 🚀 REALTIME EMIT (INI FIX UTAMA)
      const payload = {
        device_id: device.id,
        device_ip: device.ip_address,
        user_id: user.id,
        device_user_id: uid,
        name: user.name,
        timestamp: recordTime,
      };

      console.log("🔥 EMIT:", payload);

      io.emit("attendance:new", payload);
    }

    console.log("\n========== SYNC RESULT ==========");
    console.log("NEW DATA:", newCount);
    console.log("=================================\n");

    await db("devices")
      .where({ id: device.id })
      .update({
        status: "online",
        last_sync: new Date(latestTime || Date.now()),
      });

    await zk.disconnect();
  } catch (err) {
    console.error("❌ SYNC ERROR:", err);

    await db("devices").where({ id: device.id }).update({ status: "offline" });

    try {
      await zk.disconnect();
    } catch {}
  }
}
