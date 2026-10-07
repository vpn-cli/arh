CREATE TABLE "scrapbook_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'main',
	"data" jsonb NOT NULL,
	"is_current" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
