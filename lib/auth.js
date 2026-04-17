const crypto = require("node:crypto");
const { query } = require("./db");
const { parseCookies, sendJson } = require("./http");

const SESSION_COOKIE = "trainlog_session";
const COLLECTION_NAMES = ["sessions", "programs", "exercises"];

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = String(storedHash || "").split(":");
  if (!salt || !expectedHash) {
    return false;
  }

  const actualHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(expectedHash, "hex"));
}

function buildSessionCookie(token, maxAgeSeconds = 60 * 60 * 24 * 30) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax; Secure`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`;
}

async function ensureUserCollections(userId) {
  const { rows } = await query(
    "SELECT COUNT(*)::int AS count FROM user_collections WHERE user_id = $1",
    [userId]
  );

  if (rows[0]?.count > 0) {
    return;
  }

  const now = new Date().toISOString();
  await Promise.all(COLLECTION_NAMES.map((name) =>
    query(
      `INSERT INTO user_collections (user_id, name, payload, updated_at)
       VALUES ($1, $2, $3::jsonb, $4)
       ON CONFLICT (user_id, name) DO NOTHING`,
      [userId, name, "[]", now]
    )
  ));
}

async function readUserCollection(userId, name) {
  const { rows } = await query(
    "SELECT payload FROM user_collections WHERE user_id = $1 AND name = $2",
    [userId, name]
  );

  if (!rows[0]) {
    return [];
  }

  const payload = rows[0].payload;
  return Array.isArray(payload) ? payload : [];
}

async function writeUserCollection(userId, name, value) {
  const payload = Array.isArray(value) ? value : [];
  await query(
    `INSERT INTO user_collections (user_id, name, payload, updated_at)
     VALUES ($1, $2, $3::jsonb, $4)
     ON CONFLICT (user_id, name) DO UPDATE SET
       payload = EXCLUDED.payload,
       updated_at = EXCLUDED.updated_at`,
    [userId, name, JSON.stringify(payload), new Date().toISOString()]
  );
}

async function getBootstrap(userId) {
  await ensureUserCollections(userId);
  const [sessions, programs, exercises] = await Promise.all([
    readUserCollection(userId, "sessions"),
    readUserCollection(userId, "programs"),
    readUserCollection(userId, "exercises")
  ]);

  return { sessions, programs, exercises };
}

async function getUserByEmail(email) {
  const { rows } = await query(
    "SELECT id, email, password_hash, created_at FROM users WHERE email = $1",
    [normalizeEmail(email)]
  );
  return rows[0] || null;
}

async function getUserById(userId) {
  const { rows } = await query(
    "SELECT id, email, created_at FROM users WHERE id = $1",
    [userId]
  );
  return rows[0] || null;
}

async function createUser(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const userId = createId("user");

  await query(
    `INSERT INTO users (id, email, password_hash, created_at)
     VALUES ($1, $2, $3, $4)`,
    [userId, normalizedEmail, hashPassword(password), new Date().toISOString()]
  );

  await ensureUserCollections(userId);
  return getUserById(userId);
}

async function createLoginSession(res, userId) {
  const token = createSessionToken();
  const now = new Date().toISOString();

  await query(
    `INSERT INTO auth_sessions (token, user_id, created_at, last_seen_at)
     VALUES ($1, $2, $3, $4)`,
    [token, userId, now, now]
  );

  const user = await getUserById(userId);
  const bootstrap = await getBootstrap(userId);

  sendJson(
    res,
    200,
    { ok: true, user, bootstrap },
    { "Set-Cookie": buildSessionCookie(token) }
  );
}

async function getUserFromRequest(req) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token) {
    return null;
  }

  const { rows } = await query(
    `SELECT s.user_id, u.email, u.created_at
     FROM auth_sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = $1`,
    [token]
  );

  if (!rows[0]) {
    return null;
  }

  await query(
    "UPDATE auth_sessions SET last_seen_at = $1 WHERE token = $2",
    [new Date().toISOString(), token]
  );

  await ensureUserCollections(rows[0].user_id);

  return {
    id: rows[0].user_id,
    email: rows[0].email,
    created_at: rows[0].created_at
  };
}

async function requireUser(req, res) {
  const user = await getUserFromRequest(req);
  if (!user) {
    sendJson(res, 401, { error: "Authentication required." }, {
      "Set-Cookie": clearSessionCookie()
    });
    return null;
  }

  return user;
}

async function logout(req, res) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (token) {
    await query("DELETE FROM auth_sessions WHERE token = $1", [token]);
  }

  sendJson(res, 200, { ok: true }, {
    "Set-Cookie": clearSessionCookie()
  });
}

module.exports = {
  COLLECTION_NAMES,
  normalizeEmail,
  verifyPassword,
  getUserByEmail,
  getUserById,
  createUser,
  createLoginSession,
  getUserFromRequest,
  requireUser,
  logout,
  readUserCollection,
  writeUserCollection,
  getBootstrap
};
