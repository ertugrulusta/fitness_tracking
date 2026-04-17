const { methodNotAllowed, sendJson } = require("../../lib/http");
const { logout } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  try {
    return await logout(req, res);
  } catch (error) {
    return sendJson(res, 500, {
      error: "Cikis yapilamadi.",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
};
