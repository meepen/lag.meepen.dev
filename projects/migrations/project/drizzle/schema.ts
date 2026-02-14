import { pgTable, index, uuid, timestamp, varchar, integer, foreignKey, doublePrecision } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const mtrBatch = pgTable("mtr_batch", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	sourceName: varchar("source_name").notNull(),
	destinationName: varchar("destination_name").notNull(),
	testCount: integer("test_count").notNull(),
	packetSize: integer("packet_size").notNull(),
}, (table) => [
	index("idx_mtr_batch_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
]);

export const mtrResults = pgTable("mtr_results", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	hubIndex: integer("hub_index").notNull(),
	host: varchar().notNull(),
	sent: integer().notNull(),
	lost: integer().notNull(),
	averageMs: doublePrecision("average_ms").notNull(),
	bestMs: doublePrecision("best_ms").notNull(),
	worstMs: doublePrecision("worst_ms").notNull(),
	standardDeviationMs: doublePrecision("standard_deviation_ms").notNull(),
	batchId: uuid(),
}, (table) => [
	index("idx_mtr_results_batch_id").using("btree", table.batchId.asc().nullsLast().op("uuid_ops")),
	index("idx_mtr_results_hub_index_host").using("btree", table.hubIndex.asc().nullsLast().op("int4_ops"), table.host.asc().nullsLast().op("varchar_ops")),
	foreignKey({
			columns: [table.batchId],
			foreignColumns: [mtrBatch.id],
			name: "FK_1dc6ef42708724dc64b7e9f8a83"
		}),
]);
