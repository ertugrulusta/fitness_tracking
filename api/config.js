const { sendJson } = require("../lib/http");

module.exports = async function handler(_req, res) {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return sendJson(res, 500, {
      error: "Supabase config eksik.",
      detail: "SUPABASE_URL veya SUPABASE_ANON_KEY tanimli degil."
    });
  }

  return sendJson(res, 200, {
    supabaseUrl,
    supabaseAnonKey
  });
};
