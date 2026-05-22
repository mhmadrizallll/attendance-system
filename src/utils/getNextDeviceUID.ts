// src/utils/getNextDeviceUID.ts

import db from "../config/db";

export async function getNextDeviceUID() {
  const lastUser = await db("users")
    .whereNotNull("device_uid")
    .orderBy("device_uid", "desc")
    .first();

  if (!lastUser) {
    return 1;
  }

  return Number(lastUser.device_uid) + 1;
}
