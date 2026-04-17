const { methodNotAllowed, readJsonBody, sendJson } = require("../lib/http");
const { COLLECTION_NAMES, requireUser, writeUserCollection } = require("../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "PUT") {
    return methodNotAllowed(res, ["PUT"]);
  }

  try {
    const user = await requireUser(req, res);
    if (!user) {
      return;
    }

    const collectionName = String(req.query?.name || "").trim();
    if (!COLLECTION_NAMES.includes(collectionName)) {
      return sendJson(res, 404, { error: "Unknown collection." });
    }

    const body = await readJsonBody(req);
    await writeUserCollection(user.id, collectionName, body.items || []);
    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return sendJson(res, 500, {
      error: "Koleksiyon kaydedilemedi.",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
};
