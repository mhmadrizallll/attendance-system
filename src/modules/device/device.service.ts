import ZKLib from "node-zklib";
import db from "../../config/db";
import { getIO } from "../../realtime/socket";
import { getDepartment } from "../../utils/departement";

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
    let totalSkippedDeleted = 0;

    // ✅ Ambil user aktif saja
    const users = await db("users").whereNull("deleted_at").select("*");

    const userMap = new Map(
      users.map((u: any) => [String(u.device_user_id), u]),
    );

    // ✅ Ambil semua user soft delete
    const deletedUsers = await db("users")
      .whereNotNull("deleted_at")
      .select("device_user_id");

    const deletedSet = new Set(
      deletedUsers.map((u: any) => String(u.device_user_id)),
    );

    const insertData: any[] = [];

    for (const log of rawLogs) {
      const uid = String(log.deviceUserId || "");
      const recordTime = log.recordTime;

      // ❌ invalid data
      if (!uid || uid === "0" || !recordTime) {
        invalidCount++;
        continue;
      }

      // ❌ user soft delete → skip attendance
      if (deletedSet.has(uid)) {
        totalSkippedDeleted++;

        // console.log(`⛔ SKIP ATTENDANCE (deleted user): ${uid}`);

        continue;
      }

      const parsedDate = parseZKTime(recordTime);

      let user = userMap.get(uid);

      // 🆕 auto create user baru
      if (!user) {
        const [newUser] = await db("users")
          .insert({
            device_user_id: uid,
            name: `User ${uid}`,
            department: getDepartment(uid),
            deleted_at: null,
          })
          .returning("*");

        user = newUser;

        userMap.set(uid, user);

        console.log(`👤 NEW USER: ${uid}`);
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

    // ✅ chunk insert
    const chunks = chunkArray(insertData, 500);

    for (const chunk of chunks) {
      const inserted = await db("attendances")
        .insert(chunk)
        .onConflict(["device_id", "device_user_id", "timestamp"])
        .ignore()
        .returning(["id"]);

      totalInserted += inserted.length;
      totalDuplicate += chunk.length - inserted.length;

      // ✅ realtime emit
      if (inserted.length > 0) {
        const ids = inserted.map((i: any) => i.id);

        const fullData = await db("attendances as a")
          .join("users as u", "a.user_id", "u.id")
          .leftJoin("devices as d", "a.device_id", "d.id")
          .select(
            "a.device_id",
            "a.device_user_id",
            "a.timestamp",
            "u.name",
            "u.department",
            "d.name as device_name",
          )
          .whereIn("a.id", ids);

        const formatted = fullData.map((item: any) => {
          const dt = new Date(item.timestamp);

          return {
            device_id: item.device_id,
            device_user_id: item.device_user_id,
            name: item.name,
            department: item.department,
            device_name: item.device_name || "-",
            date: dt.toISOString().split("T")[0],
            time: dt.toTimeString().split(" ")[0],
          };
        });

        io.emit("attendance:batch", formatted);
      }
    }

    console.log("\n========== SYNC RESULT ==========");
    console.log("📦 PREPARED:", totalPrepared);
    console.log("✅ INSERTED:", totalInserted);
    console.log("⚠️ DUPLICATE:", totalDuplicate);
    console.log("❌ INVALID:", invalidCount);
    console.log("⛔ SKIPPED DELETED:", totalSkippedDeleted);
    console.log("=================================\n");

    // ✅ update device online
    await db("devices")
      .where({
        id: device.id,
      })
      .update({
        status: "online",
        last_sync: new Date(),
      });

    await zk.disconnect();
  } catch (err) {
    console.error("❌ SYNC ERROR:", err);

    await db("devices")
      .where({
        id: device.id,
      })
      .update({
        status: "offline",
      });

    try {
      await zk.disconnect();
    } catch {}
  }
}

// optional

// CHECK ADMIN
function isAdmin(user: any) {
  return ["admin", "superadmin"].includes(user?.role?.toLowerCase());
}
// GET DEVICES
export async function getDevices(user: any) {
  if (!isAdmin(user)) {
    throw new Error("Access denied");
  }

  return await db("devices");
}

// ADD DEVICE
export async function createDevice(payload: any, user: any) {
  if (!isAdmin(user)) {
    throw new Error("Access denied");
  }

  const inserted = await db("devices")
    .insert({
      name: payload.name,
      ip_address: payload.ip_address,
      port: payload.port,
      location: payload.location,
      status: "offline",
    })
    .returning("*");

  return inserted[0];
}

// UPDATE DEVICE
export async function updateDevice(id: string, payload: any, user: any) {
  if (!isAdmin(user)) {
    throw new Error("Access denied");
  }

  const updated = await db("devices")
    .where({ id })
    .update({
      name: payload.name,
      ip_address: payload.ip_address,
      port: payload.port,
      location: payload.location,
      updated_at: new Date(),
    })
    .returning("*");

  return updated[0];
}

// DELETE DEVICE
export async function deleteDevice(id: string, user: any) {
  if (!isAdmin(user)) {
    throw new Error("Access denied");
  }

  return db("devices").where({ id }).del();
}
