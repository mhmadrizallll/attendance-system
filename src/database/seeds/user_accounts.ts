import { Knex } from "knex";
import bcrypt from "bcryptjs";
import db from "../../config/db";

export async function seed(knex: Knex): Promise<void> {
  const hash = await bcrypt.hash("123456", 10);

  // clear data
  await db("user_accounts").del();

  // insert users
  await db("user_accounts").insert([
    {
      username: "IT",
      password: hash,
      role: "superadmin",
    },
    {
      username: "admin",
      password: hash,
      role: "admin",
    },
    {
      username: "fig_admin",
      password: hash,
      role: "fig",
    },
    {
      username: "fio_admin",
      password: hash,
      role: "fio",
    },
    {
      username: "fin_admin",
      password: hash,
      role: "fin",
    },
  ]);

  console.log("✅ SEED DONE");
}
