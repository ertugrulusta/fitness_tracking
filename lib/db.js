const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL || "";
const globalKey = "__trainlogSupabasePool";

function getPool() {
  if (!connectionString) {
    throw new Error("DATABASE_URL tanimli degil.");
  }

  if (!globalThis[globalKey]) {
    globalThis[globalKey] = new Pool({
      connectionString,
      ssl: connectionString.includes("sslmode=") ? undefined : { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 30000
    });
  }

  return globalThis[globalKey];
}

let schemaPromise = null;

async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const pool = getPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL
        );

        CREATE TABLE IF NOT EXISTS auth_sessions (
          token TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL,
          last_seen_at TIMESTAMPTZ NOT NULL
        );

        CREATE TABLE IF NOT EXISTS user_collections (
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          payload JSONB NOT NULL DEFAULT '[]'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL,
          PRIMARY KEY (user_id, name)
        );

        CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id
          ON auth_sessions (user_id);
      `);
    })();
  }

  return schemaPromise;
}

async function query(text, params = []) {
  await ensureSchema();
  return getPool().query(text, params);
}

module.exports = {
  query,
  ensureSchema
};
