// src/test-zkteco.ts

import ZKLib from "zklib-js";

async function testZKTeco() {
  // =========================
  // CONNECT DEVICE
  // =========================

  const zk = new ZKLib(
    "10.28.1.221", // ganti ip mesin
    4370, // port
    10000,
    4000,
  );

  try {
    console.log("🔌 CONNECTING DEVICE...");

    await zk.createSocket();

    console.log("✅ CONNECTED");

    // =========================
    // SHOW AVAILABLE METHODS
    // =========================

    console.log(
      "AVAILABLE METHODS:",
      Object.getOwnPropertyNames(Object.getPrototypeOf(zk)),
    );

    // =========================
    // DEVICE INFO
    // =========================

    const info = await zk.getInfo();

    console.log("DEVICE INFO:", info);

    // =========================
    // TOTAL USER BEFORE
    // =========================

    const beforeUsers = await zk.getUsers();

    console.log("👥 BEFORE TOTAL USER:", beforeUsers?.data?.length || 0);

    // =========================
    // DISABLE DEVICE
    // =========================

    await zk.disableDevice();

    console.log("⛔ DEVICE DISABLED");

    // =========================
    // PUSH USER
    // =========================

    // NOTE:
    // setUser(uid, name, password, role, userId)

    await zk.setUser(
      110, // uid internal kecil
      "Rizal Test",
      "",
      0,
      110,
    );

    console.log("✅ USER PUSH SUCCESS");

    // =========================
    // ENABLE DEVICE
    // =========================

    await zk.enableDevice();

    console.log("🟢 DEVICE ENABLED");

    // =========================
    // TOTAL USER AFTER
    // =========================

    const afterUsers = await zk.getUsers();

    console.log("👥 AFTER TOTAL USER:", afterUsers?.data?.length || 0);

    // =========================
    // CHECK USER EXIST
    // =========================

    const foundUser = afterUsers.data.find(
      (u: any) => String(u.userId) === "110",
    );

    console.log("FOUND USER:", foundUser);

    // =========================
    // DISCONNECT
    // =========================

    await zk.disconnect();

    console.log("🔌 DISCONNECTED");
  } catch (err) {
    console.error("❌ ERROR:", err);

    try {
      await zk.enableDevice();
      await zk.disconnect();
    } catch {}
  }
}

testZKTeco();
