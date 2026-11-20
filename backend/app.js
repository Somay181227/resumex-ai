const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { notFound, errorHandler } = require("./middleware/error");

const app = express();

const origins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => (!origin || origins.includes("*") || origins.includes(origin) ? cb(null, true) : cb(new Error("Not allowed by CORS"))),
  })
);
app.use(express.json({ limit: "1mb" }));
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.get("/", (req, res) => res.json({ name: "ResumeX AI API", status: "ok" }));
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/resumes", require("./routes/resumeRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
