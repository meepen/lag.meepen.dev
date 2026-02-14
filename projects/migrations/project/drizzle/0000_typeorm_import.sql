CREATE EXTENSION IF NOT EXISTS "uuid-ossp";;
--> statement-breakpoint
CREATE TABLE "mtr_batch" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"source_name" varchar NOT NULL,
	"destination_name" varchar NOT NULL,
	"test_count" integer NOT NULL,
	"packet_size" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mtr_results" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"hub_index" integer NOT NULL,
	"host" varchar NOT NULL,
	"sent" integer NOT NULL,
	"lost" integer NOT NULL,
	"average_ms" double precision NOT NULL,
	"best_ms" double precision NOT NULL,
	"worst_ms" double precision NOT NULL,
	"standard_deviation_ms" double precision NOT NULL,
	"batchId" uuid
);
--> statement-breakpoint
ALTER TABLE "mtr_results" ADD CONSTRAINT "FK_1dc6ef42708724dc64b7e9f8a83" FOREIGN KEY ("batchId") REFERENCES "public"."mtr_batch"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_mtr_batch_created_at" ON "mtr_batch" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_mtr_results_batch_id" ON "mtr_results" USING btree ("batchId" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_mtr_results_hub_index_host" ON "mtr_results" USING btree ("hub_index" int4_ops,"host" varchar_ops);
