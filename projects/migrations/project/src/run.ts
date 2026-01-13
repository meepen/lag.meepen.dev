import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

function getOrThrow(envVar: string): string {
  const value = process.env[envVar];
  if (!value) {
    throw new Error(`${envVar} is not defined`);
  }
  return value;
}

const url = new URL("postgres://localhost");
url.username = getOrThrow("POSTGRES_USER");
url.password = getOrThrow("POSTGRES_PASSWORD");
url.hostname = getOrThrow("POSTGRES_HOST");
url.port = getOrThrow("POSTGRES_PORT");
url.pathname = `/${getOrThrow("POSTGRES_DB")}`;

const connection = postgres(url.toString(), { max: 1 });
const db = drizzle(connection);

console.log("⏳ Running migrations...");

const start = Date.now();
await migrate(db, { migrationsFolder: "./drizzle" });
const end = Date.now();

console.log(`✅ Migrations completed in ${end - start}ms`);

await connection.end();
