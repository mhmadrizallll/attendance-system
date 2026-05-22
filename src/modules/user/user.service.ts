// src/modules/users/user.service.ts

import db from "../../config/db";

import ZKLib from "zklib-js";

import { getPrefixByRole } from "../../utils/getPrefixByRole";

import { pushUserToDevice } from "../device/devicePushUser.service";

import { getNextDeviceUID } from "../../utils/getNextDeviceUID";

// =========================
// CREATE USER + PUSH DEVICE
// =========================
export async function createUserService(payload: any) {
  const { device_user_id, name, department, card_number, devices } = payload;

  // =========================
  // CHECK DUPLICATE
  // =========================

  const existing = await db("users")
    .where({
      device_user_id,
    })
    .first();

  if (existing) {
    throw new Error("Device User ID already exists");
  }

  // =========================
  // GET NEXT UID
  // =========================

  const nextUID = await getNextDeviceUID();

  console.log("NEXT UID:", nextUID);

  // =========================
  // CREATE USER DB
  // =========================

  const [user] = await db("users")
    .insert({
      device_uid: nextUID,
      device_user_id,
      name,
      department,
      card_number,
      deleted_at: null,
    })
    .returning("*");

  // =========================
  // PUSH USER TO DEVICE
  // =========================

  if (devices?.length > 0) {
    const selectedDevices = await db("devices").whereIn("id", devices);

    for (const device of selectedDevices) {
      const success = await pushUserToDevice(device, user);

      // save pivot kalau sukses
      if (success) {
        await db("device_users")
          .insert({
            device_id: device.id,
            user_id: user.id,
          })
          .onConflict(["device_id", "user_id"])
          .ignore();

        console.log(
          `✅ RELATION SAVED: USER ${user.id} -> DEVICE ${device.id}`,
        );
      }
    }
  }

  return {
    success: true,
    message: "User created successfully",
    user,
  };
}

// =========================
// GET USER DETAIL + LOGS
// =========================
export async function getUserWithAttendances(userId: number, loginUser: any) {
  const prefix = getPrefixByRole(loginUser.role);

  let userQuery = db("users").where({
    id: userId,
  });

  // ROLE FILTER
  if (prefix) {
    userQuery.where("device_user_id", "like", `${prefix}%`);
  }

  const user = await userQuery.first();

  if (!user) return null;

  const attendances = await db("attendances")
    .join("devices", "attendances.device_id", "devices.id")
    .where("attendances.user_id", userId)
    .select(
      "attendances.id",
      "attendances.timestamp",
      "attendances.type",
      "attendances.device_id",

      "devices.name as device_name",
      "devices.location",
      "devices.ip_address",
    )
    .orderBy("attendances.timestamp", "desc");

  const formattedAttendances = attendances.map((a) => ({
    ...a,

    timestamp_readable: new Date(a.timestamp).toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "medium",
      timeStyle: "short",
    }),
  }));

  return {
    user,
    attendances: formattedAttendances,
  };
}

// =========================
// GET USERS
// =========================
export async function getUsersService(filters: any, user: any) {
  const { search, department, show_deleted } = filters;

  let query = db("users");

  // ROLE FILTER

  if (user.role === "fig") {
    query.where("device_user_id", "like", "700%");
  }

  if (user.role === "fio") {
    query.where("device_user_id", "like", "400%");
  }

  if (user.role === "fin") {
    query.where("device_user_id", "like", "000%");
  }

  // DELETE FILTER

  if (show_deleted === "true") {
    query.whereNotNull("deleted_at");
  } else {
    query.whereNull("deleted_at");
  }

  // SEARCH

  if (search) {
    query.where((b) => {
      b.whereILike("name", `%${search}%`).orWhereILike(
        "device_user_id",
        `%${search}%`,
      );
    });
  }

  // DEPARTMENT FILTER

  if (department) {
    query.where("department", department);
  }

  return query.select(
    "id",
    "device_uid",
    "device_user_id",
    "name",
    "department",
    "status",
    "start_date",
    "card_number",
    "created_at",
    "updated_at",
    "deleted_at",
  );
}

// =========================
// UPDATE USER
// =========================
export async function updateUser(id: string, payload: any) {
  const { name, department, card_number, device_user_id } = payload;

  console.log("\n========== UPDATE USER START ==========");
  console.log("PAYLOAD:", payload);
  console.log("USER ID:", id);

  // =========================
  // GET USER
  // =========================
  const existingUser = await db("users").where({ id }).first();

  if (!existingUser) {
    throw new Error("User not found");
  }

  console.log("✅ USER FOUND:", existingUser);

  // =========================
  // UPDATE USER DB
  // =========================
  const updated = await db("users")
    .where({ id })
    .update({
      name,
      department,
      card_number,
      device_user_id,
      updated_at: new Date(),
    })
    .returning("*");

  const user = updated[0];

  console.log("✅ USER UPDATED IN DB:", user);

  // =========================
  // GET DEVICE RELATIONS
  // =========================
  let deviceRelations = await db("device_users as du")
    .join("devices as d", "du.device_id", "d.id")
    .where("du.user_id", id)
    .select("d.*");

  console.log("📡 DEVICE RELATIONS FOUND:", deviceRelations.length);

  // =========================
  // AUTO FIX IF EMPTY RELATION
  // =========================
  if (deviceRelations.length === 0) {
    console.log("⚠️ NO DEVICE RELATION FOUND - AUTO FIX ENABLED");

    const allDevices = await db("devices");

    for (const device of allDevices) {
      await db("device_users")
        .insert({
          device_id: device.id,
          user_id: id,
        })
        .onConflict(["device_id", "user_id"])
        .ignore();
    }

    deviceRelations = await db("device_users as du")
      .join("devices as d", "du.device_id", "d.id")
      .where("du.user_id", id)
      .select("d.*");

    console.log("✅ RELATION AUTO FIXED:", deviceRelations.length);
  }

  // =========================
  // SYNC TO DEVICE
  // =========================
  for (const device of deviceRelations) {
    console.log("\n==============================");
    console.log("🔌 DEVICE:", device.name);
    console.log("IP:", device.ip_address);
    console.log("==============================");

    const zk = new ZKLib(device.ip_address, device.port, 15000, 5000);

    try {
      console.log("⏳ CONNECTING...");

      await zk.createSocket();
      console.log("✅ CONNECTED");

      await zk.disableDevice();
      console.log("⛔ DEVICE DISABLED");

      // =========================
      // DELETE OLD USER
      // =========================
      try {
        const delRes = await zk.executeCmd("SSR_DeleteEnrollData", [
          Number(user.device_uid ?? 0),
          String(user.device_user_id),
          12,
        ]);

        console.log("🗑 DELETE RESULT:", delRes);
      } catch (e) {
        console.log("⚠️ DELETE FAILED (IGNORED):", e.message);
      }

      // =========================
      // CREATE / UPDATE USER
      // =========================
      console.log("➕ SET USER TO DEVICE...");

      const setRes = await zk.setUser(
        Number(user.device_uid ?? 0),
        String(user.device_user_id),
        String(user.name),
        "",
        0,
      );

      console.log("🧾 SET USER RESULT:", setRes);

      // =========================
      // REFRESH DEVICE (IMPORTANT)
      // =========================
      try {
        if (zk.refreshData) {
          console.log("🔄 REFRESH DEVICE...");
          await zk.refreshData();
        }
      } catch (e) {
        console.log("⚠️ REFRESH NOT SUPPORTED");
      }

      await zk.enableDevice();
      console.log("▶ DEVICE ENABLED");

      await zk.disconnect();
      console.log("🔌 DISCONNECTED");

      console.log(`✅ SYNC SUCCESS: ${device.name}`);
    } catch (err) {
      console.log("❌ SYNC FAILED:", device.name);
      console.error(err);

      try {
        await zk.enableDevice();
        await zk.disconnect();
      } catch {}
    }
  }

  console.log("\n========== UPDATE USER END ==========");

  return {
    success: true,
    message: "User updated + synced successfully",
    user,
  };
}

// =========================
// SOFT DELETE USER
// =========================
export async function deleteUser(id: string) {
  const user = await db("users").where({ id }).first();

  if (!user) {
    throw new Error("User not found");
  }

  // =========================
  // GET DEVICE RELATIONS
  // =========================

  const deviceRelations = await db("device_users as du")
    .join("devices as d", "du.device_id", "d.id")
    .where("du.user_id", id)
    .select("d.*");

  // =========================
  // DELETE USER FROM DEVICE
  // =========================

  for (const device of deviceRelations) {
    const zk = new ZKLib(device.ip_address, device.port, 10000, 4000);

    try {
      await zk.createSocket();

      console.log(`🗑 DELETE USER ${user.device_user_id} FROM ${device.name}`);

      await zk.disableDevice();

      /**
       * DELETE USER COMMAND
       */

      await zk.executeCmd("SSR_DeleteEnrollData", [
        Number(user.device_uid),
        String(user.device_user_id),
        12,
      ]);

      await zk.enableDevice();

      console.log(`✅ USER DELETED FROM ${device.name}`);

      await zk.disconnect();
    } catch (err) {
      console.error(`❌ DELETE USER FAILED FROM ${device.name}`, err);

      try {
        await zk.enableDevice();
        await zk.disconnect();
      } catch {}
    }
  }

  // =========================
  // SOFT DELETE DATABASE
  // =========================

  await db("users")
    .where({ id })

    .update({
      deleted_at: new Date(),
    });

  return {
    success: true,
    message: "User deleted successfully",
  };
}

// =========================
// RESTORE USER
// =========================
export async function restoreUser(id: string) {
  const updated = await db("users")
    .where({ id })

    .update({
      deleted_at: null,
    })

    .returning("*");

  return updated[0];
}
