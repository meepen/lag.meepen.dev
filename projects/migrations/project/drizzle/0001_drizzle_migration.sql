ALTER TABLE "mtr_results" DROP CONSTRAINT "FK_1dc6ef42708724dc64b7e9f8a83";
--> statement-breakpoint
DROP INDEX "idx_mtr_batch_created_at";--> statement-breakpoint
DROP INDEX "idx_mtr_results_batch_id";--> statement-breakpoint
DROP INDEX "idx_mtr_results_hub_index_host";--> statement-breakpoint
ALTER TABLE "mtr_batch" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "mtr_results" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "mtr_results" ALTER COLUMN "average_ms" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "mtr_results" ALTER COLUMN "best_ms" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "mtr_results" ALTER COLUMN "worst_ms" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "mtr_results" ALTER COLUMN "standard_deviation_ms" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "mtr_results" ALTER COLUMN "batchId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "mtr_results" ADD CONSTRAINT "mtr_results_batchId_mtr_batch_id_fk" FOREIGN KEY ("batchId") REFERENCES "public"."mtr_batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_mtr_batch_created_at" ON "mtr_batch" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_mtr_results_batch_id" ON "mtr_results" USING btree ("batchId");--> statement-breakpoint
CREATE INDEX "idx_mtr_results_hub_index_host" ON "mtr_results" USING btree ("hub_index","host");