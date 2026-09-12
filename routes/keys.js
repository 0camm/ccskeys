const express = require("express");
const redis = require("../lib/redis");

const router = express.Router();

router.get("/keys", async (req, res) => {
  const order = await redis.lrange("key_order", 0, -1);
  if (!order.length) {
    return res.json({ keys: [] });
  }
  const raw = await redis.hmget("keys", ...order);
  const keys = order.map((id, index) => {
    const entry = raw[index];
    if (!entry) return null;
    return typeof entry === "string" ? JSON.parse(entry) : entry;
  }).filter(Boolean);
  res.json({ keys });
});

router.post("/keys/:id/copy", async (req, res) => {
  const { id } = req.params;
  const raw = await redis.hget("keys", id);
  if (!raw) {
    return res.status(404).json({ error: "key not found" });
  }
  const entry = typeof raw === "string" ? JSON.parse(raw) : raw;
  const now = new Date().toISOString();
  if (!entry.copied) {
    entry.copied = true;
    entry.copiedAt = now;
    await redis.hset("keys", { [id]: JSON.stringify(entry) });
  }
  const historyEntry = { id, key: entry.key, copiedAt: now };
  await redis.lpush("history", JSON.stringify(historyEntry));
  await redis.ltrim("history", 0, 499);
  res.json({ ok: true, key: entry });
});

router.get("/history", async (req, res) => {
  const raw = await redis.lrange("history", 0, 99);
  const history = raw.map((entry) => (typeof entry === "string" ? JSON.parse(entry) : entry));
  res.json({ history });
});

module.exports = router;
