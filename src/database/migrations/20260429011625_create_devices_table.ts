import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("devices", (table: any) => {
    table.increments("id").primary();
    table.string("name");
    table.string("ip_address").notNullable();
    table.integer("port").defaultTo(4370);
    table.string("location");
    table.string("status").defaultTo("offline");
    table.timestamp("last_sync");
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("devices");
}
