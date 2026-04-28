import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";

const connection = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "brightway",
});

export const db = drizzle(connection);