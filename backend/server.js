require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { requireAuthApi } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const keysRoutes = require("./routes/keys");

// The frontend now lives on Cloudflare Pages (a different origin), so the
// API needs to know which origin(s) are allowed to call it with credentials.
// Set this to your pages.dev URL (and/or custom domain), comma-separated.
const allowedOrigins = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const requiredEnvVars = ["ADMIN_USER", "ADMIN_PASSWORD", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "FRONTEND_ORIGINS"];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
if (missingEnvVars.length) {
  console.error(`[startup] Missing required env vars: ${missingEnvVars.join(", ")}`);
}

const app = express();

// Trust the first hop (Render/Vercel/Heroku/etc.) so req.secure and req.ip
// reflect the original client instead of the proxy.
app.set("trust proxy", 1);

// CSP no longer needs to allow the app's own scripts/styles/images since
// this process no longer serves any HTML/CSS/JS - that's all on Pages now.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  referrerPolicy: { policy: "no-referrer" },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin(origin, callback) {
    // Allow same-origin/non-browser requests (no Origin header) and any
    // explicitly allow-listed frontend origin.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`[cors] Rejected origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// Blanket rate limit as defense in depth; the login route has its own
// tighter, account-aware limiting on top of this.
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
}));

app.use((req, res, next) => {
  console.log(`[request] ${req.method} ${req.path}`);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api", requireAuthApi, keysRoutes);

app.get("/", (req, res) => {
  res.json({ ok: true, service: "ccs-keysite api" });
});

app.use((req, res) => {
  console.warn(`[404] ${req.method} ${req.path}`);
  res.status(404).json({ error: "not found" });
});

app.use((err, req, res, next) => {
  console.error(`[error] ${req.method} ${req.path}:`, err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: "internal server error" });
});

process.on("unhandledRejection", (err) => {
  console.error("[unhandledRejection]", err);
});

process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`CCS key site running on port ${port}`);
});
