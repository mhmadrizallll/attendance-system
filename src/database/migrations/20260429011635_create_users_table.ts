import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table: any) => {
    table.increments("id").primary();
    table.string("device_user_id").notNullable();
    table.string("name");
    table.string("card_number");
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("users");
}
