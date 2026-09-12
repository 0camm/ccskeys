require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { requireAuth, requireAuthApi } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const keysRoutes = require("./routes/keys");

const requiredEnvVars = ["ADMIN_USER", "ADMIN_PASSWORD", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
if (missingEnvVars.length) {
  console.error(`[startup] Missing required env vars: ${missingEnvVars.join(", ")}`);
}

const app = express();

// Trust the first hop (Render/Vercel/Heroku/etc.) so req.secure and req.ip
// reflect the original client instead of the proxy.
app.set("trust proxy", 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "https://raw.githubusercontent.com", "data:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  referrerPolicy: { policy: "no-referrer" },
  crossOriginEmbedderPolicy: false
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

app.use("/login.html", express.static(path.join(__dirname, "public", "login.html")));
app.use("/style.css", express.static(path.join(__dirname, "public", "style.css")));
app.use("/dashboard.js", express.static(path.join(__dirname, "public", "dashboard.js")));

app.use("/api/auth", authRoutes);
app.use("/api", requireAuthApi, keysRoutes);

app.get("/", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
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
