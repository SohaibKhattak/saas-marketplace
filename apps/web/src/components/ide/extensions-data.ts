export interface Extension {
  id: string;
  name: string;
  publisher: string;
  description: string;
  version: string;
  downloads: string;
  rating: number;
  category: ExtensionCategory;
  icon: string; // emoji or icon identifier
  color: string; // tailwind bg color class
}

export type ExtensionCategory =
  | "languages"
  | "formatters"
  | "themes"
  | "snippets"
  | "tools"
  | "linters";

export const categoryLabels: Record<ExtensionCategory, string> = {
  languages: "Languages",
  formatters: "Formatters",
  themes: "Themes",
  snippets: "Snippets",
  tools: "Tools",
  linters: "Linters",
};

export const extensions: Extension[] = [
  // ── Pre-installed ──────────────────────────────────────────
  {
    id: "prettier",
    name: "Prettier",
    publisher: "Prettier",
    description: "Opinionated code formatter. Supports JS, TS, CSS, HTML, JSON, and more.",
    version: "11.0.0",
    downloads: "48.2M",
    rating: 4.5,
    category: "formatters",
    icon: "✨",
    color: "bg-pink-500",
  },
  {
    id: "eslint",
    name: "ESLint",
    publisher: "Microsoft",
    description: "Integrates ESLint into the editor. Find and fix problems in your JavaScript code.",
    version: "3.0.10",
    downloads: "33.7M",
    rating: 4.6,
    category: "linters",
    icon: "🔍",
    color: "bg-purple-500",
  },
  {
    id: "tailwind-intellisense",
    name: "Tailwind CSS IntelliSense",
    publisher: "Tailwind Labs",
    description: "Intelligent Tailwind CSS tooling — autocomplete, linting, hover previews.",
    version: "0.14.3",
    downloads: "15.8M",
    rating: 4.8,
    category: "tools",
    icon: "🎨",
    color: "bg-sky-500",
  },

  // ── Recommended ────────────────────────────────────────────
  {
    id: "python",
    name: "Python",
    publisher: "Microsoft",
    description: "Rich Python language support with IntelliSense, linting, debugging, and Jupyter.",
    version: "2024.22.0",
    downloads: "122.5M",
    rating: 4.7,
    category: "languages",
    icon: "🐍",
    color: "bg-yellow-500",
  },
  {
    id: "django-snippets",
    name: "Django Snippets",
    publisher: "bibhasdn",
    description: "A collection of useful Django snippets for models, views, urls, templates, and forms.",
    version: "1.5.0",
    downloads: "1.2M",
    rating: 4.3,
    category: "snippets",
    icon: "🌿",
    color: "bg-green-600",
  },
  {
    id: "gitlens",
    name: "GitLens",
    publisher: "GitKraken",
    description: "Supercharge Git — visualize code authorship, navigate history, compare changes.",
    version: "16.1.0",
    downloads: "35.4M",
    rating: 4.4,
    category: "tools",
    icon: "🔮",
    color: "bg-teal-500",
  },
  {
    id: "thunder-client",
    name: "Thunder Client",
    publisher: "Ranga Vadhineni",
    description: "Lightweight REST API client. Test APIs directly from your editor.",
    version: "2.28.5",
    downloads: "10.1M",
    rating: 4.6,
    category: "tools",
    icon: "⚡",
    color: "bg-amber-500",
  },
  {
    id: "react-snippets",
    name: "ES7+ React Snippets",
    publisher: "dsznajder",
    description: "React/Redux/React-Native/Next.js snippets with ES7+ syntax.",
    version: "4.4.3",
    downloads: "14.2M",
    rating: 4.5,
    category: "snippets",
    icon: "⚛️",
    color: "bg-blue-500",
  },
  {
    id: "auto-rename-tag",
    name: "Auto Rename Tag",
    publisher: "Jun Han",
    description: "Automatically rename paired HTML/XML tags when editing one.",
    version: "0.1.10",
    downloads: "18.9M",
    rating: 4.2,
    category: "tools",
    icon: "🏷️",
    color: "bg-orange-500",
  },
  {
    id: "one-dark-pro",
    name: "One Dark Pro",
    publisher: "binaryify",
    description: "Atom's iconic One Dark theme for your editor. The most installed dark theme.",
    version: "3.17.0",
    downloads: "22.1M",
    rating: 4.7,
    category: "themes",
    icon: "🌙",
    color: "bg-slate-600",
  },
  {
    id: "dracula-theme",
    name: "Dracula Official",
    publisher: "Dracula Theme",
    description: "A dark theme for many editors with vibrant colors. Easy on the eyes.",
    version: "2.25.1",
    downloads: "8.6M",
    rating: 4.8,
    category: "themes",
    icon: "🧛",
    color: "bg-violet-600",
  },
  {
    id: "prisma",
    name: "Prisma",
    publisher: "Prisma",
    description: "Syntax highlighting, formatting, auto-completion, and linting for Prisma schema files.",
    version: "6.3.0",
    downloads: "5.7M",
    rating: 4.5,
    category: "languages",
    icon: "💎",
    color: "bg-indigo-500",
  },
  {
    id: "docker",
    name: "Docker",
    publisher: "Microsoft",
    description: "Build, manage, and deploy Dockerfiles and Docker Compose with ease.",
    version: "1.29.3",
    downloads: "27.3M",
    rating: 4.6,
    category: "tools",
    icon: "🐳",
    color: "bg-blue-600",
  },
  {
    id: "path-intellisense",
    name: "Path Intellisense",
    publisher: "Christian Kohler",
    description: "Autocompletes filenames and paths as you type import statements.",
    version: "2.9.0",
    downloads: "13.4M",
    rating: 4.3,
    category: "tools",
    icon: "📁",
    color: "bg-emerald-500",
  },
  {
    id: "css-modules",
    name: "CSS Modules",
    publisher: "clinyong",
    description: "CSS Modules support with autocompletion and go-to-definition for class names.",
    version: "0.5.2",
    downloads: "2.1M",
    rating: 4.1,
    category: "languages",
    icon: "🎭",
    color: "bg-rose-500",
  },
];

// IDs that start as "installed" by default
export const defaultInstalledIds = ["prettier", "eslint", "tailwind-intellisense"];
