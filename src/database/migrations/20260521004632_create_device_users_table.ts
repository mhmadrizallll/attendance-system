import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("device_users", (table) => {
    table.increments("id");

    table.integer("device_id").unsigned();
    table.integer("user_id").unsigned();

    table.timestamps(true, true);

    table.unique(["device_id", "user_id"]);

    table
      .foreign("device_id")
      .references("id")
      .inTable("devices")
      .onDelete("CASCADE");

    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("device_users");
}
