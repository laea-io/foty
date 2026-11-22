ALTER TABLE "places" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "source_id" text;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "lat" double precision;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "lng" double precision;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "hours" text;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "closed" text;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "parking" text;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "menu" text;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "overview" text;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "images" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "image_credit" text;