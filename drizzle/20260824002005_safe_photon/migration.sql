ALTER TABLE "payment_authorizations" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "payment_authorizations" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
DROP TYPE "authorization_status";--> statement-breakpoint
CREATE TYPE "authorization_status" AS ENUM('pending', 'active', 'expired', 'revoked');--> statement-breakpoint
ALTER TABLE "payment_authorizations" ALTER COLUMN "status" SET DATA TYPE "authorization_status" USING "status"::"authorization_status";--> statement-breakpoint
ALTER TABLE "payment_authorizations" ALTER COLUMN "status" SET DEFAULT 'pending'::"authorization_status";