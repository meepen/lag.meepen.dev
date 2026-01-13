import {
  pgTable,
  uuid,
  timestamp,
  varchar,
  integer,
  real,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const mtrBatch = pgTable(
  "mtr_batch",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    sourceName: varchar("source_name").notNull(),
    destinationName: varchar("destination_name").notNull(),
    testCount: integer("test_count").notNull(),
    packetSize: integer("packet_size").notNull(),
  },
  (table) => [index("idx_mtr_batch_created_at").on(table.createdAt)],
);

export const mtrBatchRelations = relations(mtrBatch, ({ many }) => ({
  results: many(mtrResult),
}));

export const mtrResult = pgTable(
  "mtr_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    batchId: uuid("batchId")
      .references(() => mtrBatch.id)
      .notNull(),
    hubIndex: integer("hub_index").notNull(),
    host: varchar("host").notNull(),
    sent: integer("sent").notNull(),
    lost: integer("lost").notNull(),
    averageMs: real("average_ms").notNull(),
    bestMs: real("best_ms").notNull(),
    worstMs: real("worst_ms").notNull(),
    standardDeviationMs: real("standard_deviation_ms").notNull(),
  },
  (table) => [
    index("idx_mtr_results_batch_id").on(table.batchId),
    index("idx_mtr_results_hub_index_host").on(table.hubIndex, table.host),
  ],
);

export const mtrResultRelations = relations(mtrResult, ({ one }) => ({
  batch: one(mtrBatch, {
    fields: [mtrResult.batchId],
    references: [mtrBatch.id],
  }),
}));
