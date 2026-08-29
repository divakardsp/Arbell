
CREATE TABLE "pre_debit_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"payment_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"razorpay_order_id" varchar(255) NOT NULL,
	"razorpay_token_id" uuid NOT NULL,
	"amount" numeric(12,2) NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"payment_after" bigint NOT NULL,
	"status" "pre_debit_status" DEFAULT 'waiting'::"pre_debit_status" NOT NULL,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE INDEX "pre_debit_payments_status_payment_after_idx" ON "pre_debit_payments" ("status","payment_after");--> statement-breakpoint
CREATE INDEX "pre_debit_payments_order_id_idx" ON "pre_debit_payments" ("order_id");--> statement-breakpoint
CREATE INDEX "pre_debit_payments_payment_id_idx" ON "pre_debit_payments" ("payment_id");--> statement-breakpoint
ALTER TABLE "pre_debit_payments" ADD CONSTRAINT "pre_debit_payments_payment_id_payments_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id");--> statement-breakpoint
ALTER TABLE "pre_debit_payments" ADD CONSTRAINT "pre_debit_payments_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id");--> statement-breakpoint
ALTER TABLE "pre_debit_payments" ADD CONSTRAINT "pre_debit_payments_razorpay_token_id_razorpay_tokens_id_fkey" FOREIGN KEY ("razorpay_token_id") REFERENCES "razorpay_tokens"("id");--> statement-breakpoint