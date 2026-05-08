import ZKLib from "node-zklib";
import db from "../../config/db";
import { getDepartment } from "../../utils/departement";

export async function syncUsersFromDevice(device: any) {
  const zk = new ZKLib(device.ip_address, device.port, 10000, 4000);

  try {
    await zk.createSocket();

    const result = await zk.getUsers();

    const users = result?.data || [];

    console.log("TOTAL USERS FROM DEVICE:", users.length);

    // ✅ preload active users
    const activeUsers = await db("users").whereNull("deleted_at").select("*");

    const activeMap = new Map(
      activeUsers.map((u: any) => [String(u.device_user_id), u]),
    );

    // ✅ preload deleted users
    const deletedUsers = await db("users")
      .whereNotNull("deleted_at")
      .select("device_user_id");

    const deletedSet = new Set(
      deletedUsers.map((u: any) => String(u.device_user_id)),
    );

    for (const u of users) {
      const deviceUserId = String(u.userId || "");

      if (!deviceUserId) continue;

      // ❌ skip kalau soft delete
      if (deletedSet.has(deviceUserId)) {
        console.log(`⛔ SKIP DELETED USER: ${deviceUserId}`);
        continue;
      }

      const existingUser = activeMap.get(deviceUserId);

      const rawName = u.name?.trim() || "";

      const isDummyName =
        rawName === "" ||
        rawName === deviceUserId ||
        rawName === `User ${deviceUserId}` ||
        /^\d+$/.test(rawName);

      const finalName = isDummyName
        ? existingUser?.name || `User ${deviceUserId}`
        : rawName;

      const finalCard = u.cardno || existingUser?.card_number || null;

      const finalDept = existingUser?.department || getDepartment(deviceUserId);

      // 🆕 user baru
      if (!existingUser) {
        const [newUser] = await db("users")
          .insert({
            device_user_id: deviceUserId,
            name: finalName,
            card_number: finalCard,
            department: finalDept,
            deleted_at: null,
          })
          .returning("*");

        activeMap.set(deviceUserId, newUser);

        console.log(`➕ NEW USER: ${deviceUserId}`);
      } else {
        // 🔄 update user existing
        await db("users")
          .where({
            id: existingUser.id,
          })
          .update({
            name: isDummyName ? existingUser.name : finalName,
            card_number: finalCard,
            department: existingUser.department || finalDept,
          });

        // console.log(`🔄 UPDATE USER: ${deviceUserId}`);
      }
    }

    console.log("✅ USERS SYNC COMPLETED");

    await zk.disconnect();
  } catch (err) {
    console.error("SYNC USERS ERROR:", err);

    try {
      await zk.disconnect();
    } catch {}
  }
}
