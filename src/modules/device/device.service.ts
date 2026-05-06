import ZKLib from "node-zklib";
import db from "../../config/db";
import { getIO } from "../../realtime/socket";

// ✅ Parse waktu ZKTeco → paksa WIB
function parseZKTime(time: string) {
  return new Date(time + " GMT+0700");
}

// ✅ Helper chunk
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

      if (!uid || uid === "0" || !recordTime) {
        invalidCount++;
        continue;
      }

      const parsedDate = parseZKTime(recordTime);

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

    const chunks = chunkArray(insertData, 500);

    for (const chunk of chunks) {
      // ✅ insert → ambil ID aja
      const inserted = await db("attendances")
        .insert(chunk)
        .onConflict(["device_id", "device_user_id", "timestamp"])
        .ignore()
        .returning(["id"]);

      totalInserted += inserted.length;
      totalDuplicate += chunk.length - inserted.length;

      // ✅ JOIN ke users biar dapet name
      if (inserted.length > 0) {
        const ids = inserted.map((i: any) => i.id);

        const fullData = await db("attendances as a")
          .join("users as u", "a.user_id", "u.id")
          .select("a.device_id", "a.device_user_id", "a.timestamp", "u.name")
          .whereIn("a.id", ids);

        const formatted = fullData.map((item: any) => {
          const dt = new Date(item.timestamp);

          return {
            device_id: item.device_id,
            device_user_id: item.device_user_id,
            name: item.name,
            date: dt.toISOString().split("T")[0], // YYYY-MM-DD
            time: dt.toTimeString().split(" ")[0], // HH:mm:ss
          };
        });
        // 🚀 kirim ke frontend
        io.emit("attendance:batch", formatted);
      }
    }

    console.log("\n========== SYNC RESULT ==========");
    console.log("📦 PREPARED:", totalPrepared);
    console.log("✅ INSERTED:", totalInserted);
    console.log("⚠️ DUPLICATE:", totalDuplicate);
    console.log("❌ INVALID:", invalidCount);
    console.log("=================================\n");

    await db("devices").where({ id: device.id }).update({
      status: "online",
      last_sync: new Date(),
    });

    await zk.disconnect();
  } catch (err) {
    console.error("❌ SYNC ERROR:", err);

    await db("devices").where({ id: device.id }).update({
      status: "offline",
    });

    try {
      await zk.disconnect();
    } catch {}
  }
}
