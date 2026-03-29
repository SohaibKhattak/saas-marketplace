"use client";

import { useState } from "react";
import { templates, Template } from "./templates";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ArrowRight,
  Code2,
  Sparkles,
  Layers,
  Server,
  Layout,
  Zap,
  Star,
  ArrowLeft,
  Store,
  Database,
} from "lucide-react";
import Link from "next/link";

const templateIcons: Record<string, React.ElementType> = {
  react: Sparkles,
  node: Server,
  nextjs: Layers,
  django: Database,
};

interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link
            href="/developer/products"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="h-4 w-4" />
            </div>
            <span>SaaS Market</span>
          </Link>
        </div>
        <ThemeToggle />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Code2 className="h-4 w-4" />
            Code Editor
          </div>
          <h1 className="text-4xl font-bold mb-4 gradient-text">
            Choose a Template
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            Start building your SaaS product from a professional template.
            Full source code, customizable, and ready to deploy.
          </p>
        </div>

        {/* Template Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full animate-slide-up">
          {templates.map((template, index) => {
            const Icon = templateIcons[template.icon] || Code2;
            const isHovered = hoveredId === template.id;

            return (
              <button
                key={template.id}
                className={`group relative text-left p-6 rounded-2xl border-2 transition-all duration-300 ${
                  isHovered
                    ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 -translate-y-2"
                    : "border-border bg-card hover:border-primary/50 hover:shadow-lg"
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredId(template.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelect(template)}
              >
                {/* Popular badge for first */}
                {index === 0 && (
                  <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Popular
                  </div>
                )}

                {/* Icon */}
                <div
                  className={`h-14 w-14 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                    isHovered
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-7 w-7" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold mb-2">{template.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {template.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Action */}
                <div
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    isHovered ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <span>Start Building</span>
                  <ArrowRight
                    className={`h-4 w-4 transition-transform ${
                      isHovered ? "translate-x-1" : ""
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom info */}
        <div className="mt-12 flex items-center gap-6 text-sm text-muted-foreground animate-fade-in">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>Instant setup</span>
          </div>
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-blue-500" />
            <span>Full source code</span>
          </div>
          <div className="flex items-center gap-2">
            <Layout className="h-4 w-4 text-green-500" />
            <span>One-click deploy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
