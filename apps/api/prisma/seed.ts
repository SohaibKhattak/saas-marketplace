import { PrismaClient } from ".prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function hash(password: string) {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.review.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.pricingPlan.deleteMany();
  await prisma.product.deleteMany();
  await prisma.developerSite.deleteMany();
  await prisma.developerProfile.deleteMany();
  await prisma.user.deleteMany();

  const password = await hash("Password1!");

  // ─── Users ──────────────────────────────────────────────────────────────

  const admin = await prisma.user.create({
    data: {
      email: "sohaibktk969@gmail.com",
      passwordHash: password,
      fullName: "Admin User",
      role: "ADMIN",
      emailVerified: true,
    },
  });

  const dev1 = await prisma.user.create({
    data: {
      email: "alice@devstudio.com",
      passwordHash: password,
      fullName: "Alice Johnson",
      role: "DEVELOPER",
      emailVerified: true,
    },
  });

  const dev2 = await prisma.user.create({
    data: {
      email: "bob@techcorp.com",
      passwordHash: password,
      fullName: "Bob Smith",
      role: "DEVELOPER",
      emailVerified: true,
    },
  });

  const dev3 = await prisma.user.create({
    data: {
      email: "carol@startup.io",
      passwordHash: password,
      fullName: "Carol Williams",
      role: "DEVELOPER",
      emailVerified: true,
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      email: "david@company.com",
      passwordHash: password,
      fullName: "David Brown",
      role: "CUSTOMER",
      emailVerified: true,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: "emma@agency.com",
      passwordHash: password,
      fullName: "Emma Davis",
      role: "CUSTOMER",
      emailVerified: true,
    },
  });

  const customer3 = await prisma.user.create({
    data: {
      email: "frank@freelance.com",
      passwordHash: password,
      fullName: "Frank Miller",
      role: "CUSTOMER",
      emailVerified: true,
    },
  });

  // Pending customer (wants to be developer)
  const pendingDev = await prisma.user.create({
    data: {
      email: "grace@newdev.com",
      passwordHash: password,
      fullName: "Grace Lee",
      role: "CUSTOMER",
      emailVerified: true,
    },
  });

  console.log("  Created 8 users");

  // ─── Developer Profiles ──────────────────────────────────────────────────

  const profile1 = await prisma.developerProfile.create({
    data: {
      userId: dev1.id,
      businessName: "Alice's Dev Studio",
      businessEmail: "business@devstudio.com",
      bio: "Full-stack developer building productivity tools for modern teams.",
      applicationStatus: "APPROVED",
      approvedAt: new Date("2025-01-15"),
    },
  });

  const profile2 = await prisma.developerProfile.create({
    data: {
      userId: dev2.id,
      businessName: "TechCorp Solutions",
      businessEmail: "hello@techcorp.com",
      taxId: "TC-123456",
      bio: "Enterprise software company specializing in CRM and analytics platforms.",
      applicationStatus: "APPROVED",
      approvedAt: new Date("2025-02-01"),
    },
  });

  const profile3 = await prisma.developerProfile.create({
    data: {
      userId: dev3.id,
      businessName: "StartupIO",
      businessEmail: "team@startup.io",
      bio: "Building the next generation of marketing automation tools.",
      applicationStatus: "APPROVED",
      approvedAt: new Date("2025-02-20"),
    },
  });

  // Pending application
  await prisma.developerProfile.create({
    data: {
      userId: pendingDev.id,
      businessName: "Grace's Software",
      businessEmail: "grace@newdev.com",
      bio: "Aspiring developer with experience in e-commerce solutions.",
      applicationStatus: "PENDING",
    },
  });

  console.log("  Created 4 developer profiles (3 approved, 1 pending)");

  // ─── Developer Sites ────────────────────────────────────────────────────

  const site1 = await prisma.developerSite.create({
    data: {
      developerId: profile1.id,
      subdomain: "alice-studio",
      siteUrl: "https://alice-studio.saasifyy.tech",
      status: "ACTIVE",
      wpSiteId: 2,
    },
  });

  const site2 = await prisma.developerSite.create({
    data: {
      developerId: profile2.id,
      subdomain: "techcorp",
      siteUrl: "https://techcorp.saasifyy.tech",
      status: "ACTIVE",
      wpSiteId: 3,
    },
  });

  const site3 = await prisma.developerSite.create({
    data: {
      developerId: profile3.id,
      subdomain: "startupio",
      siteUrl: "https://startupio.saasifyy.tech",
      status: "ACTIVE",
      wpSiteId: 4,
    },
  });

  console.log("  Created 3 WordPress sites");

  // ─── Products ──────────────────────────────────────────────────────────

  const product1 = await prisma.product.create({
    data: {
      developerId: profile1.id,
      siteId: site1.id,
      name: "TaskFlow Pro",
      slug: "taskflow-pro",
      shortDescription: "AI-powered project management for agile teams",
      description: "TaskFlow Pro is a comprehensive project management platform designed for modern agile teams. Features include Kanban boards, sprint planning, time tracking, team collaboration, and AI-powered task prioritization. Built for teams of 5 to 500, TaskFlow Pro scales with your organization.\n\nKey Features:\n- Kanban & Scrum boards with drag-and-drop\n- AI-powered sprint planning and workload balancing\n- Built-in time tracking and reporting\n- Slack and GitHub integrations\n- Custom workflows and automation rules\n- Real-time collaboration with comments and mentions",
      category: "Project Management",
      tags: ["project-management", "agile", "kanban", "ai"],
      status: "PUBLISHED",
      publishedAt: new Date("2025-03-01"),
      avgRating: 4.5,
      totalReviews: 3,
      totalSubscribers: 2,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      developerId: profile2.id,
      siteId: site2.id,
      name: "InsightCRM",
      slug: "insightcrm",
      shortDescription: "Smart CRM with predictive analytics and automation",
      description: "InsightCRM combines traditional customer relationship management with modern AI capabilities. Track leads, manage pipelines, automate follow-ups, and get predictive insights on deal outcomes.\n\nFeatures include:\n- Contact and lead management\n- Visual sales pipeline with forecasting\n- Email tracking and templates\n- Meeting scheduler\n- AI-powered lead scoring\n- Custom reports and dashboards\n- API integrations with 100+ tools",
      category: "CRM",
      tags: ["crm", "sales", "analytics", "automation"],
      status: "PUBLISHED",
      publishedAt: new Date("2025-03-10"),
      avgRating: 4.2,
      totalReviews: 2,
      totalSubscribers: 1,
    },
  });

  const product3 = await prisma.product.create({
    data: {
      developerId: profile2.id,
      siteId: site2.id,
      name: "DataViz Studio",
      slug: "dataviz-studio",
      shortDescription: "Beautiful analytics dashboards for your business data",
      description: "DataViz Studio lets you connect to any data source and create stunning, interactive dashboards in minutes. No SQL required — our visual query builder makes data exploration accessible to everyone on your team.\n\nHighlights:\n- 50+ chart types and visualization options\n- Connect to PostgreSQL, MySQL, BigQuery, Snowflake, and more\n- Drag-and-drop dashboard builder\n- Scheduled email reports\n- Embeddable charts for your website\n- Team sharing with role-based access",
      category: "Analytics",
      tags: ["analytics", "dashboards", "data", "visualization"],
      status: "PUBLISHED",
      publishedAt: new Date("2025-03-15"),
      avgRating: 4.8,
      totalReviews: 1,
      totalSubscribers: 1,
    },
  });

  const product4 = await prisma.product.create({
    data: {
      developerId: profile3.id,
      siteId: site3.id,
      name: "MailBlast",
      slug: "mailblast",
      shortDescription: "Email marketing automation for growing businesses",
      description: "MailBlast is a full-featured email marketing platform that helps you grow your audience, automate campaigns, and track results. From simple newsletters to complex drip sequences, MailBlast handles it all.\n\nCapabilities:\n- Drag-and-drop email builder with 100+ templates\n- Advanced segmentation and targeting\n- A/B testing for subject lines and content\n- Automated drip campaigns and workflows\n- Landing page builder\n- Detailed analytics and heatmaps\n- GDPR compliance tools",
      category: "Marketing",
      tags: ["email", "marketing", "automation", "newsletters"],
      status: "PUBLISHED",
      publishedAt: new Date("2025-03-20"),
      avgRating: 4.0,
      totalReviews: 1,
      totalSubscribers: 1,
    },
  });

  // Pending product
  const product5 = await prisma.product.create({
    data: {
      developerId: profile3.id,
      siteId: site3.id,
      name: "ChatBot Builder",
      slug: "chatbot-builder",
      shortDescription: "No-code chatbot platform for customer support",
      description: "Build intelligent chatbots for your website in minutes without writing a single line of code. ChatBot Builder uses AI to understand customer queries and provide instant responses, reducing support ticket volume by up to 60%.\n\nFeatures:\n- Visual flow builder\n- AI-powered natural language understanding\n- Live chat handoff\n- Multi-language support\n- Analytics dashboard\n- Integration with Slack, WhatsApp, and Messenger",
      category: "Communication",
      tags: ["chatbot", "ai", "support", "no-code"],
      status: "PENDING_REVIEW",
    },
  });

  // Draft product
  await prisma.product.create({
    data: {
      developerId: profile1.id,
      siteId: site1.id,
      name: "DevOps Dashboard",
      slug: "devops-dashboard",
      shortDescription: "Unified monitoring for your infrastructure",
      description: "A work-in-progress DevOps monitoring tool that aggregates logs, metrics, and alerts from all your services into a single dashboard.",
      category: "Developer Tools",
      tags: ["devops", "monitoring"],
      status: "DRAFT",
    },
  });

  console.log("  Created 6 products (4 published, 1 pending, 1 draft)");

  // ─── Pricing Plans ──────────────────────────────────────────────────────

  // TaskFlow Pro plans
  const tfBasic = await prisma.pricingPlan.create({
    data: {
      productId: product1.id,
      name: "Starter",
      priceMonthly: 9.99,
      priceYearly: 99.99,
      features: ["Up to 5 team members", "3 projects", "Basic Kanban boards", "Email support"],
      trialDays: 14,
      sortOrder: 1,
    },
  });

  const tfPro = await prisma.pricingPlan.create({
    data: {
      productId: product1.id,
      name: "Professional",
      priceMonthly: 29.99,
      priceYearly: 299.99,
      features: ["Up to 25 team members", "Unlimited projects", "AI sprint planning", "Slack integration", "Time tracking", "Priority support"],
      trialDays: 14,
      sortOrder: 2,
    },
  });

  await prisma.pricingPlan.create({
    data: {
      productId: product1.id,
      name: "Enterprise",
      priceMonthly: 79.99,
      priceYearly: 799.99,
      features: ["Unlimited team members", "Unlimited projects", "All AI features", "All integrations", "Custom workflows", "SSO & SAML", "Dedicated support", "SLA guarantee"],
      sortOrder: 3,
    },
  });

  // InsightCRM plans
  const crmBasic = await prisma.pricingPlan.create({
    data: {
      productId: product2.id,
      name: "Growth",
      priceMonthly: 19.99,
      priceYearly: 199.99,
      features: ["1,000 contacts", "Pipeline management", "Email tracking", "Basic reports"],
      trialDays: 7,
      sortOrder: 1,
    },
  });

  await prisma.pricingPlan.create({
    data: {
      productId: product2.id,
      name: "Business",
      priceMonthly: 49.99,
      priceYearly: 499.99,
      features: ["10,000 contacts", "AI lead scoring", "Advanced automation", "Custom dashboards", "API access", "Phone support"],
      trialDays: 7,
      sortOrder: 2,
    },
  });

  // DataViz Studio plans
  const dvPlan = await prisma.pricingPlan.create({
    data: {
      productId: product3.id,
      name: "Team",
      priceMonthly: 39.99,
      priceYearly: 399.99,
      features: ["5 dashboards", "All chart types", "3 data sources", "Daily refresh", "Team sharing"],
      trialDays: 14,
      sortOrder: 1,
    },
  });

  await prisma.pricingPlan.create({
    data: {
      productId: product3.id,
      name: "Business",
      priceMonthly: 99.99,
      priceYearly: 999.99,
      features: ["Unlimited dashboards", "All chart types", "Unlimited data sources", "Real-time refresh", "Embeddable charts", "White-label", "Priority support"],
      sortOrder: 2,
    },
  });

  // MailBlast plans
  const mbPlan = await prisma.pricingPlan.create({
    data: {
      productId: product4.id,
      name: "Starter",
      priceMonthly: 14.99,
      priceYearly: 149.99,
      features: ["2,500 subscribers", "10,000 emails/month", "Drag-and-drop builder", "Basic analytics"],
      trialDays: 7,
      sortOrder: 1,
    },
  });

  await prisma.pricingPlan.create({
    data: {
      productId: product4.id,
      name: "Pro",
      priceMonthly: 39.99,
      priceYearly: 399.99,
      features: ["25,000 subscribers", "Unlimited emails", "Advanced automation", "A/B testing", "Landing pages", "Priority support"],
      sortOrder: 2,
    },
  });

  // Pending product plan
  await prisma.pricingPlan.create({
    data: {
      productId: product5.id,
      name: "Basic",
      priceMonthly: 24.99,
      features: ["1 chatbot", "1,000 conversations/month", "AI responses", "Email support"],
      sortOrder: 1,
    },
  });

  console.log("  Created 10 pricing plans");

  // ─── Subscriptions ─────────────────────────────────────────────────────

  const sub1 = await prisma.subscription.create({
    data: {
      customerId: customer1.id,
      productId: product1.id,
      pricingPlanId: tfPro.id,
      status: "ACTIVE",
      billingCycle: "MONTHLY",
      currentPeriodStart: new Date("2025-03-01"),
      currentPeriodEnd: new Date("2025-04-01"),
    },
  });

  const sub2 = await prisma.subscription.create({
    data: {
      customerId: customer2.id,
      productId: product1.id,
      pricingPlanId: tfBasic.id,
      status: "ACTIVE",
      billingCycle: "YEARLY",
      currentPeriodStart: new Date("2025-03-05"),
      currentPeriodEnd: new Date("2026-03-05"),
    },
  });

  const sub3 = await prisma.subscription.create({
    data: {
      customerId: customer1.id,
      productId: product2.id,
      pricingPlanId: crmBasic.id,
      status: "ACTIVE",
      billingCycle: "MONTHLY",
      currentPeriodStart: new Date("2025-03-10"),
      currentPeriodEnd: new Date("2025-04-10"),
    },
  });

  const sub4 = await prisma.subscription.create({
    data: {
      customerId: customer3.id,
      productId: product3.id,
      pricingPlanId: dvPlan.id,
      status: "ACTIVE",
      billingCycle: "MONTHLY",
      currentPeriodStart: new Date("2025-03-15"),
      currentPeriodEnd: new Date("2025-04-15"),
    },
  });

  const sub5 = await prisma.subscription.create({
    data: {
      customerId: customer2.id,
      productId: product4.id,
      pricingPlanId: mbPlan.id,
      status: "TRIALING",
      billingCycle: "MONTHLY",
      currentPeriodStart: new Date("2025-03-20"),
      currentPeriodEnd: new Date("2025-04-20"),
      trialEnd: new Date("2025-03-27"),
    },
  });

  console.log("  Created 5 subscriptions");

  // ─── Transactions ──────────────────────────────────────────────────────

  const txData = [
    { sub: sub1, cust: customer1.id, dev: profile1.id, amount: 29.99, date: "2025-03-01" },
    { sub: sub2, cust: customer2.id, dev: profile1.id, amount: 99.99, date: "2025-03-05" },
    { sub: sub3, cust: customer1.id, dev: profile2.id, amount: 19.99, date: "2025-03-10" },
    { sub: sub4, cust: customer3.id, dev: profile2.id, amount: 39.99, date: "2025-03-15" },
    { sub: sub1, cust: customer1.id, dev: profile1.id, amount: 29.99, date: "2025-02-01" },
    { sub: sub3, cust: customer1.id, dev: profile2.id, amount: 19.99, date: "2025-02-10" },
    { sub: sub1, cust: customer1.id, dev: profile1.id, amount: 29.99, date: "2025-01-01" },
  ];

  for (const tx of txData) {
    const platformFee = tx.amount * 0.15;
    const developerAmount = tx.amount - platformFee;
    await prisma.transaction.create({
      data: {
        subscriptionId: tx.sub.id,
        customerId: tx.cust,
        developerId: tx.dev,
        amount: tx.amount,
        platformFee: parseFloat(platformFee.toFixed(2)),
        developerAmount: parseFloat(developerAmount.toFixed(2)),
        status: "SUCCEEDED",
        type: "PAYMENT",
        createdAt: new Date(tx.date),
      },
    });
  }

  console.log("  Created 7 transactions");

  // ─── Reviews ──────────────────────────────────────────────────────────

  await prisma.review.createMany({
    data: [
      { productId: product1.id, customerId: customer1.id, rating: 5, comment: "Excellent project management tool! The AI sprint planning feature saves us hours every week." },
      { productId: product1.id, customerId: customer2.id, rating: 4, comment: "Great tool, love the Kanban boards. Would like to see more integrations." },
      { productId: product1.id, customerId: customer3.id, rating: 4, comment: "Solid product. The UI is clean and intuitive." },
      { productId: product2.id, customerId: customer1.id, rating: 4, comment: "Good CRM for small teams. The pipeline view is very helpful." },
      { productId: product2.id, customerId: customer3.id, rating: 4, comment: "Nice lead scoring feature. Helps prioritize outreach." },
      { productId: product3.id, customerId: customer3.id, rating: 5, comment: "Best analytics tool I've used. Beautiful charts and easy to set up." },
      { productId: product4.id, customerId: customer2.id, rating: 4, comment: "Easy to use email builder. Good template selection." },
    ],
  });

  console.log("  Created 7 reviews");

  // ─── Audit Logs ─────────────────────────────────────────────────────────

  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: "DEVELOPER_APPLICATION_APPROVED", entityType: "DeveloperProfile", entityId: profile1.id, details: { developerName: "Alice Johnson" } },
      { userId: admin.id, action: "DEVELOPER_APPLICATION_APPROVED", entityType: "DeveloperProfile", entityId: profile2.id, details: { developerName: "Bob Smith" } },
      { userId: admin.id, action: "DEVELOPER_APPLICATION_APPROVED", entityType: "DeveloperProfile", entityId: profile3.id, details: { developerName: "Carol Williams" } },
      { userId: admin.id, action: "PRODUCT_PUBLISHED", entityType: "Product", entityId: product1.id, details: { productName: "TaskFlow Pro" } },
      { userId: admin.id, action: "PRODUCT_PUBLISHED", entityType: "Product", entityId: product2.id, details: { productName: "InsightCRM" } },
      { userId: admin.id, action: "PRODUCT_PUBLISHED", entityType: "Product", entityId: product3.id, details: { productName: "DataViz Studio" } },
      { userId: admin.id, action: "PRODUCT_PUBLISHED", entityType: "Product", entityId: product4.id, details: { productName: "MailBlast" } },
    ],
  });

  console.log("  Created 7 audit logs");

  console.log("\nSeed complete!");
  console.log("\nDemo Accounts (all use password: Password1!):");
  console.log("  Admin:     sohaibktk969@gmail.com");
  console.log("  Developer: alice@devstudio.com");
  console.log("  Developer: bob@techcorp.com");
  console.log("  Developer: carol@startup.io");
  console.log("  Customer:  david@company.com");
  console.log("  Customer:  emma@agency.com");
  console.log("  Customer:  frank@freelance.com");
  console.log("  Pending:   grace@newdev.com");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
