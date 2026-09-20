import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: ["./db/auth-schema.ts", "./db/admin-schema.ts"],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
