import ZKLib from "node-zklib";
import db from "../../config/db";
import { getNextDeviceUID } from "../../utils/getNextDeviceUID";
import { getDepartment } from "../../utils/departement";

export async function syncUsersFromDevice(device: any) {
  const zk = new ZKLib(device.ip_address, device.port, 10000, 4000);

  try {
    await zk.createSocket();

    const result = await zk.getUsers();
    const users = result?.data || [];

    console.log("TOTAL USERS FROM DEVICE:", users.length);

    console.log("\n========== RAW USER FROM DEVICE ==========");

    for (const u of users.slice(0, 10)) {
      console.log({
        uid: u.uid,
        userId: u.userId,
        name: u.name,
        cardno: u.cardno,
      });
    }

    console.log("=========================================\n");

    const activeUsers = await db("users").whereNull("deleted_at");

    const activeMap = new Map(
      activeUsers.map((u: any) => [String(u.device_user_id), u]),
    );

    const deletedUsers = await db("users")
      .whereNotNull("deleted_at")
      .select("device_user_id");

    const deletedSet = new Set(
      deletedUsers.map((u: any) => String(u.device_user_id)),
    );

    for (const u of users) {
      const deviceUserId = String(u.userId || "");

      if (!deviceUserId) continue;

      // skip deleted
      if (deletedSet.has(deviceUserId)) continue;

      const existing = activeMap.get(deviceUserId);

      const rawName = u.name?.trim() || "";

      const isDummy =
        rawName === "" || rawName === deviceUserId || /^\d+$/.test(rawName);

      const finalName = isDummy
        ? existing?.name || `User ${deviceUserId}`
        : rawName;

      const finalCard = u.cardno || existing?.card_number || null;

      const finalDept = existing?.department || getDepartment(deviceUserId);

      // =========================
      // 🔥 FIX: SELALU PAKAI UID
      // =========================
      if (!existing) {
        const nextUID = await getNextDeviceUID();

        const [newUser] = await db("users")
          .insert({
            device_uid: nextUID,
            device_user_id: deviceUserId,
            name: finalName,
            card_number: finalCard,
            department: finalDept,
            deleted_at: null,
          })
          .returning("*");

        // 🔥 BUAT RELASI USER -> DEVICE
        await db("device_users")
          .insert({
            user_id: newUser.id,
            device_id: device.id,
          })
          .onConflict(["user_id", "device_id"])
          .ignore();

        console.log(
          `➕ NEW USER: ${deviceUserId} (UID: ${nextUID}) -> DEVICE ${device.id}`,
        );
      } else {
        // =========================
        // USER SUDAH ADA
        // JANGAN TIMPA DATA MASTER
        // =========================

        await db("device_users")
          .insert({
            user_id: existing.id,
            device_id: device.id,
          })
          .onConflict(["user_id", "device_id"])
          .ignore();

        console.log(
          `🔗 RELATION OK: USER ${existing.id} -> DEVICE ${device.id}`,
        );
      }
    }

    console.log("✅ SYNC COMPLETED");

    await zk.disconnect();
  } catch (err) {
    console.error("SYNC ERROR:", err);

    try {
      await zk.disconnect();
    } catch {}
  }
}
