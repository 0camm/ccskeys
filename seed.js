require("dotenv").config();
const fs = require("fs");
const path = require("path");
const redis = require("./lib/redis");

async function seed() {
  const file = process.argv[2] || path.join(__dirname, "ccs-keys.txt");
  const lines = fs.readFileSync(file, "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  await redis.del("key_order");
  const existingIds = await redis.hkeys("keys");
  if (existingIds.length) {
    await redis.hdel("keys", ...existingIds);
  }

  const idsInOrder = [];
  for (let i = 0; i < lines.length; i++) {
    const id = `k${i + 1}`;
    const entry = { id, key: lines[i], copied: false, copiedAt: null };
    await redis.hset("keys", { [id]: JSON.stringify(entry) });
    idsInOrder.push(id);
  }

  if (idsInOrder.length) {
    await redis.rpush("key_order", ...idsInOrder);
  }

  console.log(`Seeded ${idsInOrder.length} keys.`);
}

seed().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
