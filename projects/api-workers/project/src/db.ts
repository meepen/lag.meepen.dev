import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@lag.meepen.dev/schema";
import postgres from "postgres";
import { type Hyperdrive } from "@cloudflare/workers-types";

export type Env = {
  HYPERDRIVE: Hyperdrive;
  CORS_ORIGINS: string;
  API_SECRET?: string;
};

export function getDb(env: Env) {
  const client = postgres(env.HYPERDRIVE.connectionString, { max: 1 });

  return drizzle(client, { schema });
}
