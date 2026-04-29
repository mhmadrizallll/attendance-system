import ZKLib from "node-zklib";
import db from "../../config/db";

export async function syncDevice(device: any) {
  const zk = new ZKLib(device.ip_address, device.port, 10000, 4000);

  try {
    await zk.createSocket();

    const result = await zk.getAttendances();
    const rawLogs = result?.data || [];

    console.log(`\n========================`);
    console.log(`DEVICE ${device.ip_address}`);
    console.log("TOTAL RAW LOGS:", rawLogs.length);
    console.log("LAST SYNC:", device.last_sync);
    console.log(`========================\n`);

    const lastSyncTime = device.last_sync
      ? new Date(device.last_sync).getTime()
      : 0;

    let latestTime = lastSyncTime;
    let newCount = 0;

    for (const log of rawLogs) {
      const uid = log.deviceUserId;
      const recordTime = log.recordTime;

      if (!uid || !recordTime) continue;

      const timestamp = new Date(recordTime).getTime();

      // 🔥 hanya ambil data baru
      if (timestamp <= lastSyncTime) continue;

      // 🔥 ONLY SHOW NEW DATA
      console.log("🔥 NEW ATTENDANCE:", {
        uid,
        recordTime,
      });

      newCount++;

      if (timestamp > latestTime) {
        latestTime = timestamp;
      }

      // 🔍 find or create user
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

      // 💾 insert attendance
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
    }

    // 📊 SUMMARY
    console.log("\n========== SYNC RESULT ==========");
    console.log("TOTAL RAW LOGS:", rawLogs.length);
    console.log("NEW ATTENDANCE:", newCount);
    console.log("=================================\n");

    // 🔥 update device
    await db("devices")
      .where({ id: device.id })
      .update({
        status: "online",
        last_sync: new Date(latestTime || Date.now()),
      });

    await zk.disconnect();
  } catch (err) {
    console.error("SYNC DEVICE ERROR:", err);

    await db("devices").where({ id: device.id }).update({
      status: "offline",
    });

    try {
      await zk.disconnect();
    } catch {}
  }
}
