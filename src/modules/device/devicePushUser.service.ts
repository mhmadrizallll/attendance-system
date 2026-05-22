// src/modules/device/devicePush.service.ts

import ZKLib from "zklib-js";

export async function pushUserToDevice(device: any, user: any) {
  const zk = new ZKLib(device.ip_address, device.port, 10000, 4000);

  try {
    // =========================
    // CONNECT
    // =========================

    await zk.createSocket();

    console.log("ok tcp");

    // =========================
    // DEVICE INFO
    // =========================

    const info = await zk.getInfo();

    console.log("DEVICE INFO:", info);

    // =========================
    // SSR MODE
    // =========================

    const ssr = await zk.getSSR();

    console.log("SSR:", ssr);

    // =========================
    // BEFORE USER
    // =========================

    const before = await zk.getUsers();

    console.log("👥 BEFORE TOTAL USER:", before?.data?.length || 0);

    // =========================
    // DISABLE DEVICE
    // =========================

    await zk.disableDevice();

    console.log("⛔ DEVICE DISABLED");

    // =========================
    // PUSH USER
    // =========================

    console.log("🚀 PUSH USER:", {
      uid: user.device_uid,
      userId: user.device_user_id,
      name: user.name,
    });

    /**
     * IMPORTANT:
     * setUser(uid, userid, name, password, role)
     */

    await zk.setUser(
      Number(user.device_uid), // UID internal kecil
      String(user.device_user_id), // NIK
      String(user.name), // nama
      "", // password
      0, // role
    );

    console.log("✅ SET USER SUCCESS");

    // =========================
    // ENABLE DEVICE
    // =========================

    await zk.enableDevice();

    console.log("🟢 DEVICE ENABLED");

    // =========================
    // AFTER USER
    // =========================

    const after = await zk.getUsers();

    console.log("👥 AFTER TOTAL USER:", after?.data?.length || 0);

    // =========================
    // FIND USER
    // =========================

    const foundUser = after.data.find(
      (u: any) => String(u.userId) === String(user.device_user_id),
    );

    console.log("FOUND USER:", foundUser);

    // =========================
    // DISCONNECT
    // =========================

    await zk.disconnect();

    console.log("🔌 DISCONNECTED");

    return !!foundUser;
  } catch (err) {
    console.error(`❌ PUSH USER FAILED TO ${device.name}`, err);

    try {
      await zk.enableDevice();
      await zk.disconnect();
    } catch {}

    return false;
  }
}
