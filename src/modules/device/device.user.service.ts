import ZKLib from "node-zklib";
import db from "../../config/db";
import { getDepartment } from "../../utils/departement";

export async function syncUsersFromDevice(device: any) {
  const zk = new ZKLib(device.ip_address, device.port, 10000, 4000);

  try {
    await zk.createSocket();

    const result = await zk.getUsers();

    const users = result?.data || [];

    console.log("TOTAL USERS:", users.length);

    for (const u of users) {
      const deviceUserId = String(u.userId || "");

      if (!deviceUserId) continue;

      // 🔥 cek user lama
      const existingUser = await db("users")
        .where({
          device_user_id: deviceUserId,
        })
        .first();

      // 🔥 kalau user sudah ada
      // SKIP TOTAL
      if (existingUser) {
        // console.log(`⏭️ SKIP USER: ${deviceUserId}`);

        continue;
      }

      // 🔥 raw name dari mesin
      const rawMachineName = u.name?.trim() || "";

      // 🔥 detect dummy name
      const isDummyName =
        rawMachineName === "" ||
        rawMachineName === deviceUserId ||
        rawMachineName === `User ${deviceUserId}` ||
        /^\d+$/.test(rawMachineName);

      // 🔥 final name
      const finalName = isDummyName ? `User ${deviceUserId}` : rawMachineName;

      // 🔥 insert ONLY
      await db("users").insert({
        device_user_id: deviceUserId,

        name: finalName,

        card_number: u.cardno || null,

        department: getDepartment(deviceUserId),
      });

      console.log(`✅ INSERT USER: ${deviceUserId} - ${finalName}`);
    }

    console.log("✅ USERS SYNC SUCCESS");

    await zk.disconnect();
  } catch (err) {
    console.error("SYNC USERS ERROR:", err);

    try {
      await zk.disconnect();
    } catch {}
  }
}
