import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  preview: {
    buckets: {
      arhbucket: { access: "private" },
    },
  },
});
