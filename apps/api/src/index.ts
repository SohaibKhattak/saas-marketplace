import { env } from "./config/env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import { logger } from "./config/logger.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
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
const PORT = env.PORT;

// Global middleware
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(pinoHttp({ logger }));
app.use(cookieParser());

// Stripe webhooks need raw body — must be before express.json()
app.use("/api/v1/webhooks", express.raw({ type: "application/json" }));

// Parse JSON for all other routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use("/api/", rateLimit(60_000, 100));

// Swagger docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (_req, res) => {
  res.json(swaggerSpec);
});

// Health check with DB connectivity
app.get("/api/health", async (_req, res) => {
  try {
    const { prisma } = await import("./config/database.js");
    await prisma.$queryRawUnsafe("SELECT 1");
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "unhealthy", timestamp: new Date().toISOString() });
  }
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
  logger.info(`API server running on http://localhost:${PORT}`);
});

export default app;
