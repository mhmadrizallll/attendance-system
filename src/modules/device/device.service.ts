import ZKLib from "node-zklib";
import db from "../../config/db";
import { getIO } from "../../realtime/socket";

// ✅ Parse waktu ZKTeco → paksa WIB
function parseZKTime(time: string) {
  return new Date(time + " GMT+0700");
}

// ✅ Helper chunk (biar gak kena limit PostgreSQL)
function chunkArray(array: any[], size: number) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export async function syncDevice(device: any) {
  const zk = new ZKLib(device.ip_address, device.port, 10000, 4000);

  try {
    await zk.createSocket();

    const result = await zk.getAttendances();
    const rawLogs = result?.data || [];

    console.log("\n========================");
    console.log("DEVICE:", device.ip_address);
    console.log("TOTAL LOGS FROM DEVICE:", rawLogs.length);
    console.log("========================\n");

    const io = getIO();

    let invalidCount = 0;
    let totalPrepared = 0;
    let totalInserted = 0;
    let totalDuplicate = 0;

    // 🔥 ambil semua user sekali
    const users = await db("users").select("*");
    const userMap = new Map(
      users.map((u: any) => [String(u.device_user_id), u]),
    );

    const insertData: any[] = [];

    for (const log of rawLogs) {
      const uid = String(log.deviceUserId || "");
      const recordTime = log.recordTime;

      // ❌ skip invalid
      if (!uid || uid === "0" || !recordTime) {
        invalidCount++;
        continue;
      }

      const parsedDate = parseZKTime(recordTime);

      // 👤 get user dari cache
      let user = userMap.get(uid);

      if (!user) {
        const [newUser] = await db("users")
          .insert({
            device_user_id: uid,
            name: `User ${uid}`,
          })
          .returning("*");

        user = newUser;
        userMap.set(uid, user);

        console.log("👤 NEW USER:", uid);
      }

      insertData.push({
        device_id: device.id,
        user_id: user.id,
        device_user_id: uid,
        timestamp: parsedDate,
        type: "check",
      });
    }

    totalPrepared = insertData.length;

    // 🔥 BATCH INSERT (ANTI ERROR POSTGRES)
    const chunks = chunkArray(insertData, 500);

    for (const chunk of chunks) {
      const inserted = await db("attendances")
        .insert(chunk)
        .onConflict(["device_id", "device_user_id", "timestamp"])
        .ignore()
        .returning("*");

      totalInserted += inserted.length;
      totalDuplicate += chunk.length - inserted.length;

      // 🚀 Emit per batch (lebih aman dari spam)
      if (inserted.length > 0) {
        io.emit("attendance:batch", inserted);
      }
    }

    console.log("\n========== SYNC RESULT ==========");
    console.log("📦 PREPARED:", totalPrepared);
    console.log("✅ INSERTED:", totalInserted);
    console.log("⚠️ DUPLICATE:", totalDuplicate);
    console.log("❌ INVALID:", invalidCount);
    console.log("=================================\n");

    // ✅ update device status aja (jangan pakai last_sync buat filter)
    await db("devices").where({ id: device.id }).update({
      status: "online",
      last_sync: new Date(),
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
