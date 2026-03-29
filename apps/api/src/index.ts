import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/error-handler.js";
import { rateLimit } from "./middleware/rate-limit.js";

// Route imports
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import developerRoutes from "./routes/developer.routes.js";
import productRoutes from "./routes/product.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import wordpressRoutes from "./routes/wordpress.routes.js";

const app = express();
const PORT = process.env.PORT ?? 4000;

// Global middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cookieParser());

// Stripe webhooks need raw body — must be before express.json()
app.use("/api/v1/webhooks", express.raw({ type: "application/json" }));

// Parse JSON for all other routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use("/api/", rateLimit(60_000, 100));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/developers", developerRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/webhooks", webhookRoutes);
app.use("/api/v1/wp", wordpressRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

export default app;
