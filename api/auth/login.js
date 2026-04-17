const { methodNotAllowed, readJsonBody, sendJson } = require("../../lib/http");
const { getUserByEmail, verifyPassword, createLoginSession, normalizeEmail } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  try {
    const body = await readJsonBody(req);
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    const user = await getUserByEmail(email);

    if (!user || !verifyPassword(password, user.password_hash)) {
      return sendJson(res, 401, { error: "Email veya sifre hatali." });
    }

    return createLoginSession(res, user.id);
  } catch (error) {
    return sendJson(res, 500, {
      error: "Giris yapilamadi.",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
};
