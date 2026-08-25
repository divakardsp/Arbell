ALTER TABLE "products" ADD COLUMN "available_stock" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "reserve_stock" integer DEFAULT 0 NOT NULL;