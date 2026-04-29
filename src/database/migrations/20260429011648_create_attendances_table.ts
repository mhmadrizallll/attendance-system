import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("attendances", (table: any) => {
    table.increments("id").primary();

    table
      .integer("device_id")
      .references("id")
      .inTable("devices")
      .onDelete("CASCADE");

    table
      .integer("user_id")
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");

    table.string("device_user_id").notNullable();

    // ✅ cukup satu ini
    table.timestamp("timestamp", { useTz: true }).notNullable();

    table.string("type");

    table.unique(["device_id", "device_user_id", "timestamp"]);

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("attendances");
}
