require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const { requireAuth, requireAuthApi } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const keysRoutes = require("./routes/keys");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/login.html", express.static(path.join(__dirname, "public", "login.html")));
app.use("/style.css", express.static(path.join(__dirname, "public", "style.css")));
app.use("/dashboard.js", express.static(path.join(__dirname, "public", "dashboard.js")));

app.use("/api/auth", authRoutes);
app.use("/api", requireAuthApi, keysRoutes);

app.get("/", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`CCS key site running on port ${port}`);
});
