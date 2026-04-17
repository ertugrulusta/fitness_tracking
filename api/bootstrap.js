const { methodNotAllowed, sendJson } = require("../lib/http");
const { requireUser, getBootstrap } = require("../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET"]);
  }

  try {
    const user = await requireUser(req, res);
    if (!user) {
      return;
    }

    const bootstrap = await getBootstrap(user.id);
    return sendJson(res, 200, {
      user,
      ...bootstrap
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: "Bootstrap okunamadi.",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
};
