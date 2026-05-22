import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("users", (table: any) => {
    table.integer("device_uid").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("users", (table: any) => {
    table.dropColumn("device_uid");
  });
}
