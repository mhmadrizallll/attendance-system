import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";

import db from "../../config/db";

const JWT_SECRET = "SECRET123";

export async function loginService(username: string, password: string) {
  const user = await db("user_accounts")
    .where({
      username,
    })
    .first();

  if (!user) {
    throw new Error("User not found");
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    throw new Error("Wrong password");
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },

    JWT_SECRET,

    {
      expiresIn: "1d",
    },
  );

  return {
    token,

    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  };
}
