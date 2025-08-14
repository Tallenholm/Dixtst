import { defineConfig } from "drizzle-kit";
import { DATABASE_URL } from "../server/config/index.ts";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
