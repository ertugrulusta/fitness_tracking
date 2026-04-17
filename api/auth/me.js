const { methodNotAllowed, sendJson } = require("../../lib/http");
const { requireUser } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  try {
    const user = await requireUser(req, res);
    if (!user) {
      return;
    }

    return sendJson(res, 200, { user });
  } catch (error) {
    return sendJson(res, 500, {
      error: "Kullanici bilgisi okunamadi.",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
};
