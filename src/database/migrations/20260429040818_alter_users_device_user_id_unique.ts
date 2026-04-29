import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("users", (table: any) => {
    table.unique("device_user_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("users", (table: any) => {
    table.dropUnique("device_user_id");
  });
}
