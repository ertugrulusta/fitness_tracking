const { methodNotAllowed, readJsonBody, sendJson } = require("../../lib/http");
const { getUserByEmail, createUser, createLoginSession, normalizeEmail } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  try {
    const body = await readJsonBody(req);
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");

    if (!email || !password) {
      return sendJson(res, 400, { error: "Email ve sifre zorunlu." });
    }

    if (password.length < 6) {
      return sendJson(res, 400, { error: "Sifre en az 6 karakter olmali." });
    }

    if (await getUserByEmail(email)) {
      return sendJson(res, 409, { error: "Bu email zaten kayitli." });
    }

    const user = await createUser(email, password);
    return createLoginSession(res, user.id);
  } catch (error) {
    return sendJson(res, 500, {
      error: "Kayit olusturulamadi.",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
};
