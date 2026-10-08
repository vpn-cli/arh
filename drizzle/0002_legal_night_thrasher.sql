CREATE TABLE "lyrics_cache" (
	"spotify_id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"synced" text,
	"plain" text,
	"instrumental" boolean DEFAULT false NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
