import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@lag.meepen.dev/schema";
import postgres from "postgres";
import { type Hyperdrive } from "@cloudflare/workers-types";

export type Env = {
  HYPERDRIVE: Hyperdrive;
  API_SECRET?: string;
};

const cache = new WeakMap<Env, PostgresJsDatabase<typeof schema>>();

export function getDb(env: Env) {
  if (cache.has(env)) {
    return cache.get(env) as PostgresJsDatabase<typeof schema>;
  }

  const client = postgres(env.HYPERDRIVE.connectionString, { max: 1 });

  const db = drizzle(client, { schema });
  cache.set(env, db);
  return db;
}
