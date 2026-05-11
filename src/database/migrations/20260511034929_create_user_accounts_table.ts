import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("user_accounts", (table) => {
    table.increments("id").primary();

    table.string("username").unique().notNullable();

    table.string("password").notNullable();

    table.string("role").notNullable();

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("user_accounts");
}
