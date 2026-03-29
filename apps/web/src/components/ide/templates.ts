export interface FileNode {
  name: string;
  type: "file" | "folder";
  content?: string;
  language?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  tags: string[];
  files: FileNode[];
}

export const templates: Template[] = [
  {
    id: "react-saas",
    name: "React SaaS Starter",
    description: "Full-featured React SaaS with auth, dashboard, billing, and landing page",
    icon: "react",
    tags: ["React", "TypeScript", "Tailwind", "Stripe"],
    files: [
      {
        name: "src",
        type: "folder",
        isOpen: true,
        children: [
          {
            name: "App.tsx",
            type: "file",
            language: "typescript",
            content: `import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Pricing from './pages/Pricing';
import './styles/globals.css';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}`,
          },
          {
            name: "pages",
            type: "folder",
            isOpen: true,
            children: [
              {
                name: "Landing.tsx",
                type: "file",
                language: "typescript",
                content: `import React from 'react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <header className="container mx-auto px-6 py-16">
        <nav className="flex items-center justify-between mb-16">
          <h1 className="text-2xl font-bold text-indigo-600">YourSaaS</h1>
          <div className="flex gap-4">
            <a href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="/login" className="bg-indigo-600 text-white px-4 py-2 rounded-lg">
              Get Started
            </a>
          </div>
        </nav>

        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Build Something Amazing
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            The all-in-one platform to launch, grow, and scale your SaaS business.
          </p>
          <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg
                           hover:bg-indigo-700 transition-colors shadow-lg">
            Start Free Trial
          </button>
        </div>
      </header>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: 'Analytics', desc: 'Real-time insights into your business metrics' },
            { title: 'Automation', desc: 'Automate repetitive tasks and workflows' },
            { title: 'Integrations', desc: 'Connect with 100+ popular tools' },
          ].map((feature, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}`,
              },
              {
                name: "Dashboard.tsx",
                type: "file",
                language: "typescript",
                content: `import React from 'react';

const stats = [
  { label: 'Total Users', value: '2,847', change: '+12%' },
  { label: 'Revenue', value: '$48,295', change: '+8%' },
  { label: 'Active Plans', value: '1,423', change: '+15%' },
  { label: 'Churn Rate', value: '2.1%', change: '-0.3%' },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
              <p className="text-sm text-green-600 mt-1">{stat.change}</p>
            </div>
          ))}
        </div>

        {/* Chart Placeholder */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Revenue Over Time</h2>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-400">Chart Component Here</p>
          </div>
        </div>
      </div>
    </div>
  );
}`,
              },
              {
                name: "Login.tsx",
                type: "file",
                language: "typescript",
                content: `import React, { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement authentication
    console.log('Login:', { email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
          >
            Sign In
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account? <a href="#" className="text-indigo-600">Sign up</a>
        </p>
      </div>
    </div>
  );
}`,
              },
              {
                name: "Pricing.tsx",
                type: "file",
                language: "typescript",
                content: `import React from 'react';

const plans = [
  {
    name: 'Starter',
    price: '$9',
    features: ['1,000 users', '5GB storage', 'Basic analytics', 'Email support'],
  },
  {
    name: 'Pro',
    price: '$29',
    popular: true,
    features: ['10,000 users', '50GB storage', 'Advanced analytics', 'Priority support', 'API access'],
  },
  {
    name: 'Enterprise',
    price: '$99',
    features: ['Unlimited users', '500GB storage', 'Custom analytics', '24/7 support', 'API access', 'SSO'],
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl font-bold text-center mb-4">Simple Pricing</h1>
        <p className="text-gray-600 text-center mb-12">Choose the plan that works for you</p>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={\`bg-white rounded-xl shadow-sm p-8 \${
                plan.popular ? 'ring-2 ring-indigo-600 scale-105' : ''
              }\`}
            >
              {plan.popular && (
                <span className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold mt-4">{plan.name}</h3>
              <p className="text-3xl font-bold mt-2">
                {plan.price}<span className="text-sm text-gray-500">/mo</span>
              </p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center text-sm text-gray-600">
                    <span className="text-green-500 mr-2">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button className={\`w-full mt-8 py-2 rounded-lg \${
                plan.popular
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'border border-gray-300 hover:bg-gray-50'
              }\`}>
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`,
              },
            ],
          },
          {
            name: "context",
            type: "folder",
            children: [
              {
                name: "AuthContext.tsx",
                type: "file",
                language: "typescript",
                content: `import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // TODO: Call your API
    setUser({ id: '1', email, name: 'Demo User' });
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};`,
              },
              {
                name: "ThemeContext.tsx",
                type: "file",
                language: "typescript",
                content: `import React, { createContext, useContext, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: 'light', toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div className={theme}>{children}</div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);`,
              },
            ],
          },
          {
            name: "styles",
            type: "folder",
            children: [
              {
                name: "globals.css",
                type: "file",
                language: "css",
                content: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: #ffffff;
    --foreground: #0f172a;
  }
  .dark {
    --background: #0f172a;
    --foreground: #f8fafc;
  }
  body {
    @apply bg-[var(--background)] text-[var(--foreground)] antialiased;
  }
}`,
              },
            ],
          },
        ],
      },
      {
        name: "package.json",
        type: "file",
        language: "json",
        content: `{
  "name": "my-saas-app",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "tailwindcss": "^4.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}`,
      },
      {
        name: "index.html",
        type: "file",
        language: "html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My SaaS App</title>
  <link rel="stylesheet" href="/src/styles/globals.css" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/App.tsx"></script>
</body>
</html>`,
      },
      {
        name: "README.md",
        type: "file",
        language: "markdown",
        content: `# My SaaS App

A modern SaaS application built with React, TypeScript, and Tailwind CSS.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features

- Landing page with hero & features
- Authentication (login/register)
- Dashboard with analytics
- Pricing page with plan comparison
- Dark mode support
- Responsive design
`,
      },
    ],
  },
  {
    id: "node-api",
    name: "Node.js API Backend",
    description: "RESTful API with Express, JWT auth, database models, and Stripe integration",
    icon: "node",
    tags: ["Node.js", "Express", "TypeScript", "PostgreSQL"],
    files: [
      {
        name: "src",
        type: "folder",
        isOpen: true,
        children: [
          {
            name: "index.ts",
            type: "file",
            language: "typescript",
            content: `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { productsRouter } from './routes/products';
import { billingRouter } from './routes/billing';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/products', productsRouter);
app.use('/api/billing', billingRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(\`Server running on port \${PORT}\`);
});

export default app;`,
          },
          {
            name: "routes",
            type: "folder",
            isOpen: true,
            children: [
              {
                name: "auth.ts",
                type: "file",
                language: "typescript",
                content: `import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';

export const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: { email, password: hashedPassword, name },
    });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({ user: { id: user.id, email, name }, token });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await db.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({ user: { id: user.id, email: user.email, name: user.name }, token });
  } catch (error) {
    next(error);
  }
});`,
              },
              {
                name: "users.ts",
                type: "file",
                language: "typescript",
                content: `import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../config/database';

export const usersRouter = Router();

usersRouter.get('/me', authenticate, async (req, res) => {
  const user = await db.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  res.json({ user });
});

usersRouter.patch('/me', authenticate, async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await db.user.update({
      where: { id: req.userId },
      data: { name },
      select: { id: true, email: true, name: true },
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
});`,
              },
              {
                name: "products.ts",
                type: "file",
                language: "typescript",
                content: `import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../config/database';

export const productsRouter = Router();

productsRouter.get('/', async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = search
    ? { name: { contains: String(search), mode: 'insensitive' as const } }
    : {};

  const [products, total] = await Promise.all([
    db.product.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
    db.product.count({ where }),
  ]);

  res.json({ products, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
});

productsRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const { name, description, price, category } = req.body;
    const product = await db.product.create({
      data: { name, description, price, category, userId: req.userId },
    });
    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
});`,
              },
              {
                name: "billing.ts",
                type: "file",
                language: "typescript",
                content: `import { Router } from 'express';
import Stripe from 'stripe';
import { authenticate } from '../middleware/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const billingRouter = Router();

billingRouter.post('/create-checkout', authenticate, async (req, res, next) => {
  try {
    const { priceId } = req.body;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: \`\${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}\`,
      cancel_url: \`\${process.env.FRONTEND_URL}/pricing\`,
      metadata: { userId: req.userId },
    });

    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
});

billingRouter.get('/subscription', authenticate, async (req, res) => {
  // TODO: Fetch user's active subscription
  res.json({ subscription: null });
});`,
              },
            ],
          },
          {
            name: "middleware",
            type: "folder",
            children: [
              {
                name: "auth.ts",
                type: "file",
                language: "typescript",
                content: `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}`,
              },
              {
                name: "errorHandler.ts",
                type: "file",
                language: "typescript",
                content: `import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error(err.message, { stack: err.stack, path: req.path });

  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
}`,
              },
            ],
          },
          {
            name: "config",
            type: "folder",
            children: [
              {
                name: "database.ts",
                type: "file",
                language: "typescript",
                content: `import { PrismaClient } from '@prisma/client';

export const db = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
});`,
              },
            ],
          },
          {
            name: "utils",
            type: "folder",
            children: [
              {
                name: "logger.ts",
                type: "file",
                language: "typescript",
                content: `export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date().toISOString() }));
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: 'error', message, ...meta, timestamp: new Date().toISOString() }));
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: 'warn', message, ...meta, timestamp: new Date().toISOString() }));
  },
};`,
              },
            ],
          },
        ],
      },
      {
        name: "prisma",
        type: "folder",
        children: [
          {
            name: "schema.prisma",
            type: "file",
            language: "prisma",
            content: `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  products  Product[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  price       Float
  category    String?
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}`,
          },
        ],
      },
      {
        name: "package.json",
        type: "file",
        language: "json",
        content: `{
  "name": "my-saas-api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "express": "^5.0.0",
    "cors": "^2.8.5",
    "helmet": "^8.0.0",
    "bcryptjs": "^3.0.0",
    "jsonwebtoken": "^9.0.0",
    "stripe": "^18.0.0",
    "@prisma/client": "^7.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tsx": "^4.0.0",
    "prisma": "^7.0.0",
    "@types/express": "^5.0.0"
  }
}`,
      },
      {
        name: ".env.example",
        type: "file",
        language: "plaintext",
        content: `DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
JWT_SECRET=your-super-secret-jwt-key
STRIPE_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:3000
PORT=3001`,
      },
    ],
  },
  {
    id: "fullstack",
    name: "Full-Stack SaaS",
    description: "Next.js full-stack app with API routes, auth, database, and Stripe billing",
    icon: "nextjs",
    tags: ["Next.js", "TypeScript", "Prisma", "Stripe"],
    files: [
      {
        name: "app",
        type: "folder",
        isOpen: true,
        children: [
          {
            name: "layout.tsx",
            type: "file",
            language: "typescript",
            content: `import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'My SaaS Platform',
  description: 'A modern SaaS platform built with Next.js',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}`,
          },
          {
            name: "page.tsx",
            type: "file",
            language: "typescript",
            content: `export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-24">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-6">Your SaaS Platform</h1>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Everything you need to build, launch, and grow your software business.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="/register" className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">
              Start Free
            </a>
            <a href="/demo" className="border border-white px-6 py-3 rounded-lg hover:bg-white/10">
              Live Demo
            </a>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-500 mb-6">Trusted by 1,000+ companies worldwide</p>
          <div className="flex justify-center gap-12 opacity-50">
            {['Acme', 'TechCorp', 'StartupXYZ', 'DevHouse'].map(name => (
              <span key={name} className="text-xl font-bold text-gray-400">{name}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}`,
          },
          {
            name: "globals.css",
            type: "file",
            language: "css",
            content: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 15, 23, 42;
  --background-rgb: 255, 255, 255;
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
}`,
          },
          {
            name: "api",
            type: "folder",
            children: [
              {
                name: "auth",
                type: "folder",
                children: [
                  {
                    name: "route.ts",
                    type: "file",
                    language: "typescript",
                    content: `import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/jwt';

export async function POST(req: NextRequest) {
  const { email, password, action } = await req.json();

  if (action === 'register') {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await db.user.create({ data: { email, password: hashed } });
    const token = signToken({ userId: user.id });

    return NextResponse.json({ token, user: { id: user.id, email } });
  }

  // Login
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = signToken({ userId: user.id });
  return NextResponse.json({ token, user: { id: user.id, email: user.email } });
}`,
                  },
                ],
              },
            ],
          },
          {
            name: "dashboard",
            type: "folder",
            children: [
              {
                name: "page.tsx",
                type: "file",
                language: "typescript",
                content: `'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState({ users: 0, revenue: 0, products: 0 });

  useEffect(() => {
    // TODO: Fetch real stats from API
    setStats({ users: 1250, revenue: 45000, products: 32 });
  }, []);

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <StatCard title="Total Users" value={stats.users.toLocaleString()} />
        <StatCard title="Revenue" value={\`$\${stats.revenue.toLocaleString()}\`} />
        <StatCard title="Products" value={stats.products.toString()} />
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}`,
              },
            ],
          },
        ],
      },
      {
        name: "components",
        type: "folder",
        children: [
          {
            name: "Navbar.tsx",
            type: "file",
            language: "typescript",
            content: `'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          YourSaaS
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
          <Link href="/docs" className="text-gray-600 hover:text-gray-900">Docs</Link>
          <Link href="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
          <Link href="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            Get Started
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </nav>
  );
}`,
          },
        ],
      },
      {
        name: "lib",
        type: "folder",
        children: [
          {
            name: "database.ts",
            type: "file",
            language: "typescript",
            content: `import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;`,
          },
          {
            name: "jwt.ts",
            type: "file",
            language: "typescript",
            content: `import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret';

export function signToken(payload: Record<string, unknown>) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET) as Record<string, unknown>;
}`,
          },
        ],
      },
      {
        name: "package.json",
        type: "file",
        language: "json",
        content: `{
  "name": "my-fullstack-saas",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@prisma/client": "^7.0.0",
    "bcryptjs": "^3.0.0",
    "jsonwebtoken": "^9.0.0",
    "stripe": "^18.0.0",
    "tailwindcss": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "prisma": "^7.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0"
  }
}`,
      },
      {
        name: "next.config.ts",
        type: "file",
        language: "typescript",
        content: `import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Enable latest Next.js features
  },
};

export default nextConfig;`,
      },
    ],
  },
  {
    id: "django-saas",
    name: "Django SaaS Backend",
    description: "Python Django REST API with auth, multi-tenancy, Stripe billing, and admin panel",
    icon: "django",
    tags: ["Python", "Django", "REST API", "PostgreSQL"],
    files: [
      {
        name: "manage.py",
        type: "file",
        language: "python",
        content: `#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()`,
      },
      {
        name: "requirements.txt",
        type: "file",
        language: "plaintext",
        content: `Django>=5.1,<6.0
djangorestframework>=3.15
django-cors-headers>=4.4
django-filter>=24.3
djangorestframework-simplejwt>=5.3
psycopg[binary]>=3.2
stripe>=10.0
python-dotenv>=1.0
gunicorn>=23.0
celery>=5.4
redis>=5.1
Pillow>=10.0`,
      },
      {
        name: "config",
        type: "folder",
        isOpen: true,
        children: [
          {
            name: "__init__.py",
            type: "file",
            language: "python",
            content: ``,
          },
          {
            name: "settings.py",
            type: "file",
            language: "python",
            content: `"""Django settings for SaaS project."""
import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-change-me-in-production')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'corsheaders',
    'django_filters',
    # Local apps
    'apps.accounts',
    'apps.products',
    'apps.billing',
    'apps.tenants',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.tenants.middleware.TenantMiddleware',
]

ROOT_URLCONF = 'config.urls'
AUTH_USER_MODEL = 'accounts.User'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'saas_db'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}

# Stripe
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', '')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET', '')

# CORS
CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ORIGINS', 'http://localhost:3000'
).split(',')

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'`,
          },
          {
            name: "urls.py",
            type: "file",
            language: "python",
            content: `"""URL configuration for SaaS project."""
from django.contrib import admin
from django.urls import path, include
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({'status': 'ok', 'service': 'saas-api'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health-check'),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/billing/', include('apps.billing.urls')),
    path('api/tenants/', include('apps.tenants.urls')),
]`,
          },
          {
            name: "wsgi.py",
            type: "file",
            language: "python",
            content: `"""WSGI config for SaaS project."""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
application = get_wsgi_application()`,
          },
        ],
      },
      {
        name: "apps",
        type: "folder",
        isOpen: true,
        children: [
          {
            name: "__init__.py",
            type: "file",
            language: "python",
            content: ``,
          },
          {
            name: "accounts",
            type: "folder",
            isOpen: true,
            children: [
              {
                name: "__init__.py",
                type: "file",
                language: "python",
                content: ``,
              },
              {
                name: "models.py",
                type: "file",
                language: "python",
                content: `from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model with role-based access."""

    class Role(models.TextChoices):
        CUSTOMER = 'customer', 'Customer'
        DEVELOPER = 'developer', 'Developer'
        ADMIN = 'admin', 'Admin'

    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    stripe_customer_id = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} ({self.role})"

    @property
    def is_developer(self):
        return self.role in (self.Role.DEVELOPER, self.Role.ADMIN)

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN`,
              },
              {
                name: "serializers.py",
                type: "file",
                language: "python",
                content: `from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'role')

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'role', 'avatar', 'created_at')
        read_only_fields = ('id', 'created_at')`,
              },
              {
                name: "views.py",
                type: "file",
                language: "python",
                content: `from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Register a new user and return JWT tokens."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get or update the authenticated user's profile."""
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """Authenticate user and return JWT tokens."""
    email = request.data.get('email')
    password = request.data.get('password')

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.check_password(password):
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    refresh = RefreshToken.for_user(user)
    return Response({
        'user': UserSerializer(user).data,
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
    })`,
              },
              {
                name: "urls.py",
                type: "file",
                language: "python",
                content: `from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.login_view, name='login'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]`,
              },
              {
                name: "admin.py",
                type: "file",
                language: "python",
                content: `from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'role', 'is_active', 'created_at')
    list_filter = ('role', 'is_active', 'is_staff')
    search_fields = ('email', 'username')
    ordering = ('-created_at',)`,
              },
            ],
          },
          {
            name: "products",
            type: "folder",
            children: [
              {
                name: "__init__.py",
                type: "file",
                language: "python",
                content: ``,
              },
              {
                name: "models.py",
                type: "file",
                language: "python",
                content: `from django.db import models
from django.conf import settings


class Product(models.Model):
    """SaaS product listed on the marketplace."""

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PENDING = 'pending', 'Pending Review'
        PUBLISHED = 'published', 'Published'
        REJECTED = 'rejected', 'Rejected'

    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    developer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='products',
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )
    logo = models.ImageField(upload_to='products/', blank=True, null=True)
    category = models.CharField(max_length=100, blank=True)
    website_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class PricingPlan(models.Model):
    """Pricing plan for a product."""

    class Interval(models.TextChoices):
        MONTHLY = 'monthly', 'Monthly'
        YEARLY = 'yearly', 'Yearly'

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='plans'
    )
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    interval = models.CharField(
        max_length=10,
        choices=Interval.choices,
        default=Interval.MONTHLY,
    )
    features = models.JSONField(default=list)
    stripe_price_id = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.product.name} - {self.name}"`,
              },
              {
                name: "views.py",
                type: "file",
                language: "python",
                content: `from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product, PricingPlan
from .serializers import ProductSerializer, PricingPlanSerializer


class IsDevOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.is_developer


class ProductViewSet(viewsets.ModelViewSet):
    """CRUD for marketplace products."""
    serializer_class = ProductSerializer
    permission_classes = [IsDevOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name']

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.is_developer:
            return Product.objects.filter(developer=self.request.user)
        return Product.objects.filter(status=Product.Status.PUBLISHED)

    def perform_create(self, serializer):
        serializer.save(developer=self.request.user)`,
              },
              {
                name: "serializers.py",
                type: "file",
                language: "python",
                content: `from rest_framework import serializers
from .models import Product, PricingPlan


class PricingPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingPlan
        fields = '__all__'
        read_only_fields = ('stripe_price_id',)


class ProductSerializer(serializers.ModelSerializer):
    plans = PricingPlanSerializer(many=True, read_only=True)
    developer_name = serializers.CharField(
        source='developer.username', read_only=True
    )

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('developer', 'slug', 'status')`,
              },
              {
                name: "urls.py",
                type: "file",
                language: "python",
                content: `from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('', views.ProductViewSet, basename='product')

urlpatterns = [
    path('', include(router.urls)),
]`,
              },
            ],
          },
          {
            name: "billing",
            type: "folder",
            children: [
              {
                name: "__init__.py",
                type: "file",
                language: "python",
                content: ``,
              },
              {
                name: "views.py",
                type: "file",
                language: "python",
                content: `import stripe
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

stripe.api_key = settings.STRIPE_SECRET_KEY


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_checkout_session(request):
    """Create a Stripe checkout session for a subscription."""
    price_id = request.data.get('price_id')

    try:
        session = stripe.checkout.Session.create(
            mode='subscription',
            payment_method_types=['card'],
            line_items=[{'price': price_id, 'quantity': 1}],
            success_url=f"{settings.CORS_ALLOWED_ORIGINS[0]}/dashboard?success=true",
            cancel_url=f"{settings.CORS_ALLOWED_ORIGINS[0]}/pricing",
            customer_email=request.user.email,
            metadata={'user_id': str(request.user.id)},
        )
        return Response({'url': session.url})
    except stripe.StripeError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    """Handle Stripe webhook events."""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except (ValueError, stripe.SignatureVerificationError):
        return Response(status=status.HTTP_400_BAD_REQUEST)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        # TODO: Activate subscription for user
        print(f"Checkout completed for user {session['metadata']['user_id']}")

    return Response({'status': 'ok'})`,
              },
              {
                name: "urls.py",
                type: "file",
                language: "python",
                content: `from django.urls import path
from . import views

urlpatterns = [
    path('checkout/', views.create_checkout_session, name='create-checkout'),
    path('webhook/', views.stripe_webhook, name='stripe-webhook'),
]`,
              },
            ],
          },
          {
            name: "tenants",
            type: "folder",
            children: [
              {
                name: "__init__.py",
                type: "file",
                language: "python",
                content: ``,
              },
              {
                name: "models.py",
                type: "file",
                language: "python",
                content: `from django.db import models
from django.conf import settings


class Tenant(models.Model):
    """Represents a tenant (organization) in the multi-tenant system."""

    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_tenants',
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='TenantMembership',
        related_name='tenants',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class TenantMembership(models.Model):
    """Through model for tenant membership with roles."""

    class Role(models.TextChoices):
        OWNER = 'owner', 'Owner'
        ADMIN = 'admin', 'Admin'
        MEMBER = 'member', 'Member'

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.MEMBER,
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('tenant', 'user')`,
              },
              {
                name: "middleware.py",
                type: "file",
                language: "python",
                content: `from django.utils.deprecation import MiddlewareMixin


class TenantMiddleware(MiddlewareMixin):
    """Middleware to identify the current tenant from the request."""

    def process_request(self, request):
        # Extract tenant from subdomain or header
        tenant_slug = request.META.get('HTTP_X_TENANT', None)
        if not tenant_slug:
            host = request.get_host().split(':')[0]
            parts = host.split('.')
            if len(parts) > 2:
                tenant_slug = parts[0]

        request.tenant_slug = tenant_slug`,
              },
              {
                name: "urls.py",
                type: "file",
                language: "python",
                content: `from django.urls import path

urlpatterns = [
    # Tenant management endpoints will go here
]`,
              },
            ],
          },
        ],
      },
      {
        name: ".env.example",
        type: "file",
        language: "plaintext",
        content: `SECRET_KEY=django-insecure-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=*
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CORS_ORIGINS=http://localhost:3000`,
      },
      {
        name: "Dockerfile",
        type: "file",
        language: "plaintext",
        content: `FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput 2>/dev/null || true

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]`,
      },
    ],
  },
];

// Utility to flatten file tree for the editor
export function flattenFiles(
  nodes: FileNode[],
  parentPath = ""
): { path: string; content: string; language: string }[] {
  const result: { path: string; content: string; language: string }[] = [];

  for (const node of nodes) {
    const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
    if (node.type === "file" && node.content !== undefined) {
      result.push({
        path: currentPath,
        content: node.content,
        language: node.language || "plaintext",
      });
    }
    if (node.children) {
      result.push(...flattenFiles(node.children, currentPath));
    }
  }

  return result;
}

// Get language from file extension
export function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    css: "css",
    html: "html",
    md: "markdown",
    prisma: "prisma",
    env: "plaintext",
    example: "plaintext",
    yml: "yaml",
    yaml: "yaml",
    py: "python",
    txt: "plaintext",
    dockerfile: "dockerfile",
  };
  return map[ext || ""] || "plaintext";
}
