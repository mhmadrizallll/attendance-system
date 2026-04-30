import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("it_recipients", (table: any) => {
    table.increments("id").primary();
    table.string("name");
    table.string("email");
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("it_recipients");
}
