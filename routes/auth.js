const express = require("express");
const crypto = require("crypto");
const redis = require("../lib/redis");

const router = express.Router();

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (username !== process.env.ADMIN_USER || password !== process.env.ADMIN_PASSWORD) {
      console.warn(`[auth] Failed login attempt for username "${username}"`);
      return res.status(401).json({ error: "invalid credentials" });
    }
    const token = crypto.randomBytes(32).toString("hex");
    await redis.set(`session:${token}`, username, { ex: SESSION_TTL_SECONDS });
    res.cookie("ccs_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: req.secure,
      maxAge: SESSION_TTL_SECONDS * 1000
    });
    console.log(`[auth] Login succeeded for username "${username}"`);
    res.json({ ok: true });
  } catch (err) {
    console.error("[auth] /login failed:", err);
    res.status(500).json({ error: "login failed" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies.ccs_session;
    if (token) {
      await redis.del(`session:${token}`);
    }
    res.clearCookie("ccs_session");
    res.json({ ok: true });
  } catch (err) {
    console.error("[auth] /logout failed:", err);
    res.status(500).json({ error: "logout failed" });
  }
});

module.exports = router;
