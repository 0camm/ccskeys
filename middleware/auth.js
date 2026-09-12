const redis = require("../lib/redis");

async function requireAuth(req, res, next) {
  const token = req.cookies.ccs_session;
  if (!token) {
    return res.redirect("/login.html");
  }
  const session = await redis.get(`session:${token}`);
  if (!session) {
    res.clearCookie("ccs_session");
    return res.redirect("/login.html");
  }
  next();
}

async function requireAuthApi(req, res, next) {
  const token = req.cookies.ccs_session;
  if (!token) {
    return res.status(401).json({ error: "not authenticated" });
  }
  const session = await redis.get(`session:${token}`);
  if (!session) {
    return res.status(401).json({ error: "not authenticated" });
  }
  next();
}

module.exports = { requireAuth, requireAuthApi };
