import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table: any) => {
    table.string("department");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table: any) => {
    table.dropColumn("department");
  });
}
