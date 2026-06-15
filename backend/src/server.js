import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { apiLimiter } from "./middleware/rateLimiter.js";
import listingsRouter from "./routes/listings.js";
import uploadRouter   from "./routes/upload.js";
import contactRouter  from "./routes/contact.js";
import adminRouter    from "./routes/admin.js";
import usersRouter    from "./routes/users.js";

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── Security middleware ───────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.FRONTEND_URL || "http://localhost:8080",
  credentials: true,
}));

// ─── Body parsers ─────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Global rate limiter ──────────────────────────────────────
app.use("/api", apiLimiter);

// ─── Health check ─────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status:    "ok",
    service:   "Second Sync API",
    timestamp: new Date().toISOString(),
    version:   "1.0.0",
  });
});

// ─── API Routes ───────────────────────────────────────────────
app.use("/api/listings", listingsRouter);
app.use("/api/upload",   uploadRouter);
app.use("/api/contact",  contactRouter);
app.use("/api/admin",    adminRouter);
app.use("/api/users",    usersRouter);

// ─── 404 handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// ─── Global error handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[Error]", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error.",
  });
});

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Second Sync API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Environment: ${process.env.NODE_ENV || "development"}\n`);
});

export default app;
