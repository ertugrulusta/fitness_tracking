const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { URL } = require("node:url");
const { DatabaseSync } = require("node:sqlite");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const SESSION_COOKIE = "trainlog_session";

const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(ROOT, "data");
const DB_PATH = path.join(DATA_DIR, "trainlog.sqlite");

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS collections (
    name TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS auth_sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_collections (
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

const collectionNames = new Set(["sessions", "programs", "exercises"]);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon"
};

const selectUserByEmailStmt = db.prepare("SELECT id, email, password_hash, created_at FROM users WHERE email = ?");
const selectUserByIdStmt = db.prepare("SELECT id, email, created_at FROM users WHERE id = ?");
const insertUserStmt = db.prepare("INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)");
const insertAuthSessionStmt = db.prepare("INSERT INTO auth_sessions (token, user_id, created_at, last_seen_at) VALUES (?, ?, ?, ?)");
const selectAuthSessionStmt = db.prepare("SELECT token, user_id FROM auth_sessions WHERE token = ?");
const updateAuthSessionStmt = db.prepare("UPDATE auth_sessions SET last_seen_at = ? WHERE token = ?");
const deleteAuthSessionStmt = db.prepare("DELETE FROM auth_sessions WHERE token = ?");
const readGlobalCollectionStmt = db.prepare("SELECT payload FROM collections WHERE name = ?");
const writeGlobalCollectionStmt = db.prepare(`
  INSERT INTO collections (name, payload, updated_at)
  VALUES (?, ?, ?)
  ON CONFLICT(name) DO UPDATE SET
    payload = excluded.payload,
    updated_at = excluded.updated_at
`);
const readUserCollectionStmt = db.prepare("SELECT payload FROM user_collections WHERE user_id = ? AND name = ?");
const writeUserCollectionStmt = db.prepare(`
  INSERT INTO user_collections (user_id, name, payload, updated_at)
  VALUES (?, ?, ?, ?)
  ON CONFLICT(user_id, name) DO UPDATE SET
    payload = excluded.payload,
    updated_at = excluded.updated_at
`);
const userCollectionCountStmt = db.prepare("SELECT COUNT(*) AS count FROM user_collections WHERE user_id = ?");

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

function parseCookies(cookieHeader) {
  return String(cookieHeader || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((accumulator, part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex === -1) {
        return accumulator;
      }
      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      accumulator[key] = decodeURIComponent(value);
      return accumulator;
    }, {});
}

function readGlobalCollection(name) {
  const row = readGlobalCollectionStmt.get(name);
  if (!row) {
    return [];
  }

  try {
    const parsed = JSON.parse(row.payload);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGlobalCollection(name, value) {
  if (!Array.isArray(value)) {
    throw new Error("Collection payload must be an array.");
  }
  writeGlobalCollectionStmt.run(name, JSON.stringify(value), new Date().toISOString());
}

function readUserCollection(userId, name) {
  const row = readUserCollectionStmt.get(userId, name);
  if (!row) {
    return [];
  }

  try {
    const parsed = JSON.parse(row.payload);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUserCollection(userId, name, value) {
  if (!Array.isArray(value)) {
    throw new Error("Collection payload must be an array.");
  }
  writeUserCollectionStmt.run(userId, name, JSON.stringify(value), new Date().toISOString());
}

function ensureUserCollections(userId) {
  const existingCount = userCollectionCountStmt.get(userId).count;
  if (existingCount > 0) {
    return;
  }

  for (const name of collectionNames) {
    writeUserCollection(userId, name, readGlobalCollection(name));
  }
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response, statusCode, payload, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders
  });
  response.end(JSON.stringify(payload));
}

function sendFile(response, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || "application/octet-stream";
  const stream = fs.createReadStream(filePath);
  stream.on("error", () => {
    sendJson(response, 404, { error: "File not found." });
  });
  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  });
  stream.pipe(response);
}

function requireUser(request, response) {
  const cookies = parseCookies(request.headers.cookie);
  const token = cookies[SESSION_COOKIE];
  if (!token) {
    sendJson(response, 401, { error: "Authentication required." });
    return null;
  }

  const authSession = selectAuthSessionStmt.get(token);
  if (!authSession) {
    sendJson(response, 401, { error: "Invalid session." }, {
      "Set-Cookie": `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
    });
    return null;
  }

  updateAuthSessionStmt.run(new Date().toISOString(), token);
  const user = selectUserByIdStmt.get(authSession.user_id);
  if (!user) {
    sendJson(response, 401, { error: "User not found." });
    return null;
  }

  ensureUserCollections(user.id);
  return user;
}

function getUserFromRequest(request) {
  const cookies = parseCookies(request.headers.cookie);
  const token = cookies[SESSION_COOKIE];
  if (!token) {
    return null;
  }

  const authSession = selectAuthSessionStmt.get(token);
  if (!authSession) {
    return null;
  }

  updateAuthSessionStmt.run(new Date().toISOString(), token);
  const user = selectUserByIdStmt.get(authSession.user_id);
  if (!user) {
    return null;
  }

  ensureUserCollections(user.id);
  return user;
}

async function handleSignup(request, response) {
  const body = await readRequestBody(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");

  if (!email || !password) {
    return sendJson(response, 400, { error: "Email and password are required." });
  }

  if (password.length < 6) {
    return sendJson(response, 400, { error: "Password must be at least 6 characters." });
  }

  if (selectUserByEmailStmt.get(email)) {
    return sendJson(response, 409, { error: "Bu email zaten kayitli." });
  }

  const userId = createId("user");
  insertUserStmt.run(userId, email, hashPassword(password), new Date().toISOString());
  ensureUserCollections(userId);
  return createLoginSession(response, userId);
}

async function handleLogin(request, response) {
  const body = await readRequestBody(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || "");
  const user = selectUserByEmailStmt.get(email);

  if (!user || !verifyPassword(password, user.password_hash)) {
    return sendJson(response, 401, { error: "Email veya sifre hatali." });
  }

  ensureUserCollections(user.id);
  return createLoginSession(response, user.id);
}

function createLoginSession(response, userId) {
  const token = createSessionToken();
  const now = new Date().toISOString();
  insertAuthSessionStmt.run(token, userId, now, now);
  const user = selectUserByIdStmt.get(userId);
  const bootstrap = {
    sessions: readUserCollection(userId, "sessions"),
    programs: readUserCollection(userId, "programs"),
    exercises: readUserCollection(userId, "exercises")
  };

  return sendJson(
    response,
    200,
    { ok: true, user, bootstrap },
    {
      "Set-Cookie": `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
    }
  );
}

function handleLogout(request, response) {
  const cookies = parseCookies(request.headers.cookie);
  const token = cookies[SESSION_COOKIE];
  if (token) {
    deleteAuthSessionStmt.run(token);
  }
  return sendJson(
    response,
    200,
    { ok: true },
    {
      "Set-Cookie": `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
    }
  );
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || `${HOST}:${PORT}`}`);
  const pathname = requestUrl.pathname;

  try {
    if (request.method === "POST" && pathname === "/api/auth/signup") {
      return handleSignup(request, response);
    }

    if (request.method === "POST" && pathname === "/api/auth/login") {
      return handleLogin(request, response);
    }

    if (request.method === "POST" && pathname === "/api/auth/logout") {
      return handleLogout(request, response);
    }

    if (request.method === "GET" && pathname === "/api/auth/me") {
      const user = requireUser(request, response);
      if (!user) {
        return;
      }
      return sendJson(response, 200, { user });
    }

    if (request.method === "GET" && pathname === "/api/bootstrap") {
      const user = requireUser(request, response);
      if (!user) {
        return;
      }

      return sendJson(response, 200, {
        user,
        sessions: readUserCollection(user.id, "sessions"),
        programs: readUserCollection(user.id, "programs"),
        exercises: readUserCollection(user.id, "exercises")
      });
    }

    if (request.method === "PUT" && (pathname === "/api/collections" || pathname.startsWith("/api/collections/"))) {
      const user = requireUser(request, response);
      if (!user) {
        return;
      }

      const name = pathname === "/api/collections"
        ? requestUrl.searchParams.get("name")
        : pathname.split("/").pop();
      if (!collectionNames.has(name)) {
        return sendJson(response, 404, { error: "Unknown collection." });
      }

      const body = await readRequestBody(request);
      writeUserCollection(user.id, name, body.items || []);
      return sendJson(response, 200, { ok: true });
    }

    if (request.method === "POST" && pathname === "/api/migrate-localstorage") {
      const user = requireUser(request, response);
      if (!user) {
        return;
      }

      const body = await readRequestBody(request);
      for (const name of collectionNames) {
        if (Array.isArray(body[name])) {
          writeUserCollection(user.id, name, body[name]);
        }
      }
      return sendJson(response, 200, { ok: true });
    }

    if (request.method === "GET" && pathname === "/login") {
      return sendFile(response, path.join(ROOT, "login.html"));
    }

    if (request.method === "GET" && pathname === "/") {
      const user = getUserFromRequest(request);
      if (!user) {
        response.writeHead(302, { Location: "/login" });
        response.end();
        return;
      }
      return sendFile(response, path.join(ROOT, "index.html"));
    }

    if (request.method === "GET" && pathname === "/index.html") {
      return sendFile(response, path.join(ROOT, "index.html"));
    }

    const normalizedPath = path.normalize(path.join(ROOT, pathname));
    if (!normalizedPath.startsWith(ROOT)) {
      return sendJson(response, 403, { error: "Forbidden." });
    }

    if (fs.existsSync(normalizedPath) && fs.statSync(normalizedPath).isFile()) {
      return sendFile(response, normalizedPath);
    }

    return sendJson(response, 404, { error: "Not found." });
  } catch (error) {
    return sendJson(response, 500, {
      error: "Server error.",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`TrainLog server running at http://${HOST}:${PORT}`);
  console.log(`SQLite DB: ${DB_PATH}`);
});
