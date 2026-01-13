import { relations } from "drizzle-orm/relations";
import { mtrBatch, mtrResults } from "./schema";

export const mtrResultsRelations = relations(mtrResults, ({one}) => ({
	mtrBatch: one(mtrBatch, {
		fields: [mtrResults.batchId],
		references: [mtrBatch.id]
	}),
}));

export const mtrBatchRelations = relations(mtrBatch, ({many}) => ({
	mtrResults: many(mtrResults),
}));