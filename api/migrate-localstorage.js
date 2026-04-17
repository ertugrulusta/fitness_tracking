const { methodNotAllowed, readJsonBody, sendJson } = require("../lib/http");
const { COLLECTION_NAMES, requireUser, writeUserCollection } = require("../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(res, ["POST"]);
  }

  try {
    const user = await requireUser(req, res);
    if (!user) {
      return;
    }

    const body = await readJsonBody(req);
    await Promise.all(COLLECTION_NAMES.map((name) => {
      if (!Array.isArray(body[name])) {
        return Promise.resolve();
      }

      return writeUserCollection(user.id, name, body[name]);
    }));

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return sendJson(res, 500, {
      error: "LocalStorage migrasyonu basarisiz.",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
};
