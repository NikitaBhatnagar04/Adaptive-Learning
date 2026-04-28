import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/src/schema",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: "localhost",
    port: 3306,
    user: "root",
    password: "1234",
    database: "brightways",
  },
});