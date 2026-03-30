"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Code2,
  Globe,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Terminal,
  Layers,
  Palette,
  Zap,
  Shield,
  CheckCircle2,
} from "lucide-react";

const codeEditorFeatures = [
  "Monaco Editor (VS Code engine)",
  "React, Node.js, Next.js & Django templates",
  "Full file explorer with CRUD operations",
  "Live preview with device toggles",
  "Built-in terminal & console",
  "Extensions marketplace",
  "One-click deploy to platform",
];

const noCodeFeatures = [
  "WordPress-powered site builder",
  "Drag & drop page building",
  "Pre-built themes & plugins",
  "Custom subdomain hosting",
  "WooCommerce integration",
  "SEO tools built-in",
  "No coding required",
];

export default function StartBuildingPage() {
  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/developer/products" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Start Building</span>
      </div>

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Start Building Your Product</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Choose how you want to build your SaaS product. Use our powerful code editor for full control,
          or go no-code with WordPress for a quick launch.
        </p>
      </div>

      {/* Two Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Code Editor Option */}
        <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all group">
          <div className="absolute top-4 right-4">
            <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
              Full Control
            </Badge>
          </div>
          <CardHeader className="pb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-2">
              <Code2 className="h-7 w-7 text-blue-500" />
            </div>
            <CardTitle className="text-2xl">Code Editor</CardTitle>
            <CardDescription className="text-base">
              Build with code using our web-based IDE powered by the same engine as VS Code.
              Full flexibility with any framework.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tech Stack Icons */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5">
                <Terminal className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs font-medium">Node.js</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5">
                <Layers className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-medium">React</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5">
                <Zap className="h-3.5 w-3.5 text-yellow-500" />
                <span className="text-xs font-medium">Next.js</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5">
                <Shield className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-medium">Django</span>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-2.5">
              {codeEditorFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link href="/ide" className="block">
              <Button className="w-full h-12 text-base group/btn">
                Open Code Editor
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* No-Code / WordPress Option */}
        <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all group">
          <div className="absolute top-4 right-4">
            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
              No Code
            </Badge>
          </div>
          <CardHeader className="pb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/20 to-teal-500/20 mb-2">
              <Globe className="h-7 w-7 text-green-500" />
            </div>
            <CardTitle className="text-2xl">WordPress Builder</CardTitle>
            <CardDescription className="text-base">
              Launch your SaaS product without writing a single line of code.
              Powered by WordPress with custom subdomain hosting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* WordPress Stack */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5">
                <Globe className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-medium">WordPress</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5">
                <Palette className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-xs font-medium">Themes</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5">
                <Layers className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-xs font-medium">Plugins</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5">
                <Zap className="h-3.5 w-3.5 text-yellow-500" />
                <span className="text-xs font-medium">WooCommerce</span>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-2.5">
              {noCodeFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link href="/developer/sites" className="block">
              <Button variant="outline" className="w-full h-12 text-base group/btn">
                Launch WordPress Site
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <div className="text-center max-w-xl mx-auto pb-8">
        <p className="text-sm text-muted-foreground">
          Not sure which to choose?{" "}
          <span className="font-medium text-foreground">Code Editor</span> gives you full control with any tech stack.{" "}
          <span className="font-medium text-foreground">WordPress</span> is perfect for quick launches without coding.
          You can use both for different products.
        </p>
      </div>
    </div>
  );
}
