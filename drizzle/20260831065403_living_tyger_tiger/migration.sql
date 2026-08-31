ALTER TABLE "payment_authorizations" DROP CONSTRAINT "payment_authorizations_merchant_id_merchants_id_fkey";--> statement-breakpoint
ALTER TABLE "payment_authorizations" DROP COLUMN "merchant_id";