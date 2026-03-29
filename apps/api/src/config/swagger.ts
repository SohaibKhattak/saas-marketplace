import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SaaS Marketplace API",
      version: "1.0.0",
      description:
        "REST API for the Multi-Tenant SaaS Marketplace Platform. Provides endpoints for authentication, product management, subscriptions, payments, and administration.",
      contact: { name: "SaaS Marketplace Team" },
    },
    servers: [
      { url: "/api/v1", description: "API v1" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                code: { type: "string" },
                message: { type: "string" },
                details: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      field: { type: "string" },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            fullName: { type: "string" },
            role: { type: "string", enum: ["CUSTOMER", "DEVELOPER", "ADMIN"] },
            avatarUrl: { type: "string", nullable: true },
            emailVerified: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            slug: { type: "string" },
            shortDescription: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            status: { type: "string", enum: ["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "UNPUBLISHED"] },
            logoUrl: { type: "string", nullable: true },
            screenshots: { type: "array", items: { type: "string" } },
            averageRating: { type: "number" },
            reviewCount: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        PricingPlan: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            priceMonthly: { type: "number" },
            priceYearly: { type: "number", nullable: true },
            features: { type: "array", items: { type: "string" } },
            trialDays: { type: "integer" },
            isActive: { type: "boolean" },
          },
        },
        Subscription: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            status: { type: "string", enum: ["TRIALING", "ACTIVE", "PAST_DUE", "CANCELED", "EXPIRED"] },
            billingCycle: { type: "string", enum: ["MONTHLY", "YEARLY"] },
            currentPeriodStart: { type: "string", format: "date-time" },
            currentPeriodEnd: { type: "string", format: "date-time" },
            cancelAtPeriodEnd: { type: "boolean" },
          },
        },
        Transaction: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            amount: { type: "number" },
            platformFee: { type: "number" },
            developerAmount: { type: "number" },
            type: { type: "string", enum: ["PAYMENT", "REFUND"] },
            status: { type: "string", enum: ["SUCCEEDED", "FAILED", "REFUNDED"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            total: { type: "integer" },
            page: { type: "integer" },
            limit: { type: "integer" },
            totalPages: { type: "integer" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
