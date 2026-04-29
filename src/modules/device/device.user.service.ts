import ZKLib from "node-zklib";
import db from "../../config/db";

export async function syncUsersFromDevice(device: any) {
  const zk = new ZKLib(device.ip_address, device.port, 10000, 4000);

  try {
    await zk.createSocket();

    const result = await zk.getUsers();

    // 🔥 TARUH DI SINI
    // console.log("RAW USERS:");
    // console.dir(result, { depth: null });

    const users = result?.data || [];

    // console.log("TOTAL USERS:", users.length);

    // 🔥 LIHAT 5 DATA PERTAMA
    // console.dir(users.slice(0, 5), { depth: null });

    for (const u of users) {
      const deviceUserId = u.userId;

      if (!deviceUserId) continue;

      await db("users")
        .insert({
          device_user_id: deviceUserId,
          name: u.name || `User ${deviceUserId}`,
          card_number: u.cardno || null,
        })
        .onConflict("device_user_id")
        .merge();
    }

    await zk.disconnect();
  } catch (err) {
    console.error("SYNC USERS ERROR:", err);
  }
}
