import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { readFileSync } from "node:fs";
import postgres from "postgres";

function getOrThrow(envVar: string): string {
  const value = process.env[envVar];
  if (!value) {
    throw new Error(`${envVar} is not defined`);
  }
  return value;
}

function getSslOption() {
  const sslMode = process.env.POSTGRES_SSL_MODE ?? "disable";
  const rootCert = process.env.POSTGRES_SSL_ROOT_CERT ?? "";

  switch (sslMode) {
    case "disable":
      return false;
    case "require":
      return { rejectUnauthorized: false };
    case "verify-ca":
    case "verify-full": {
      if (!rootCert) {
        throw new Error(
          "POSTGRES_SSL_ROOT_CERT is required when POSTGRES_SSL_MODE is verify-ca or verify-full",
        );
      }
      const ca = readFileSync(rootCert, "utf8");
      return { rejectUnauthorized: true, ca };
    }
    default:
      throw new Error(
        "POSTGRES_SSL_MODE must be one of: disable, require, verify-ca, verify-full",
      );
  }
}

const url = new URL("postgres://localhost");
url.username = getOrThrow("POSTGRES_USER");
url.password = getOrThrow("POSTGRES_PASSWORD");
url.hostname = getOrThrow("POSTGRES_HOST");
url.port = getOrThrow("POSTGRES_PORT");
url.pathname = `/${getOrThrow("POSTGRES_DB")}`;

const connection = postgres(url.toString(), { max: 1, ssl: getSslOption() });
const db = drizzle(connection);

console.log("⏳ Running migrations...");

const start = Date.now();
await migrate(db, { migrationsFolder: "./drizzle" });
const end = Date.now();

console.log(`✅ Migrations completed in ${end - start}ms`);

await connection.end();
