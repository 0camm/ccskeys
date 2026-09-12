const { Redis } = require("@upstash/redis");

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.error("[redis] UPSTASH_REDIS_REST_URL and/or UPSTASH_REDIS_REST_TOKEN are missing. Redis calls will fail.");
} else {
  console.log(`[redis] Connecting to ${url}`);
}

const redis = new Redis({ url, token });

module.exports = redis;
