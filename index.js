const fs = require("node:fs");
const path = require("node:path");
const { sendJson } = require("./lib/http");

const rootDir = __dirname;

const staticFiles = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/login", "login.html"],
  ["/login.html", "login.html"],
  ["/styles.css", "styles.css"],
  ["/app.client.js", "app.client.js"],
  ["/login.client.js", "login.client.js"]
]);

const apiHandlers = new Map([
  ["/api/auth/login", require("./api/auth/login")],
  ["/api/auth/signup", require("./api/auth/signup")],
  ["/api/auth/logout", require("./api/auth/logout")],
  ["/api/auth/me", require("./api/auth/me")],
  ["/api/bootstrap", require("./api/bootstrap")],
  ["/api/collections", require("./api/collections")],
  ["/api/migrate-localstorage", require("./api/migrate-localstorage")]
]);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon"
};

function sendFile(res, filename) {
  const filePath = path.join(rootDir, filename);
  if (!fs.existsSync(filePath)) {
    return sendJson(res, 404, { error: "File not found." });
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extension] || "application/octet-stream";
  const fileContents = fs.readFileSync(filePath);

  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  });
  res.end(fileContents);
}

module.exports = async function handler(req, res) {
  const origin = `https://${req.headers.host || "localhost"}`;
  const requestUrl = new URL(req.url, origin);
  const pathname = requestUrl.pathname;

  try {
    if (pathname === "/favicon.ico" || pathname === "/favicon.png") {
      res.writeHead(204);
      res.end();
      return;
    }

    const apiHandler = apiHandlers.get(pathname);
    if (apiHandler) {
      return apiHandler(req, res);
    }

    const staticFilename = staticFiles.get(pathname);
    if (staticFilename) {
      return sendFile(res, staticFilename);
    }

    return sendJson(res, 404, { error: "Not found." });
  } catch (error) {
    return sendJson(res, 500, {
      error: "Server error.",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
};
