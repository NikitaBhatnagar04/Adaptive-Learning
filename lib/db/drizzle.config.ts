export default defineConfig({
  out: "./drizzle", // ✅ FIXED
  schema: "./lib/db/src/schema/index.ts",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});