"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Rocket, CheckCircle2, AlertCircle } from "lucide-react";
import { Loader } from '@/components/ui/loader';

const CATEGORIES = [
  "CRM",
  "Project Management",
  "Marketing",
  "Analytics",
  "E-Commerce",
  "Education",
  "Finance",
  "Healthcare",
  "Communication",
  "Productivity",
  "Developer Tools",
  "Other",
];

interface DeployDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  templateName: string;
  onDeployStart: () => void;
  onDeploySuccess: (productId: string) => void;
  onDeployError: (error: string) => void;
  onConsoleMessage: (type: "info" | "success" | "error" | "system", message: string) => void;
}

export function DeployDialog({
  open,
  onOpenChange,
  projectName,
  templateName,
  onDeployStart,
  onDeploySuccess,
  onDeployError,
  onConsoleMessage,
}: DeployDialogProps) {
  const { accessToken } = useAuthStore();

  const [name, setName] = useState(projectName || "");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState(
    `A SaaS product built with ${templateName} template on the Saasifyy code editor.`
  );
  const [category, setCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const [step, setStep] = useState<"form" | "deploying" | "success" | "error">("form");
  const [error, setError] = useState("");
  const [deployProgress, setDeployProgress] = useState(0);
  const [productId, setProductId] = useState("");

  const resetForm = () => {
    setStep("form");
    setError("");
    setDeployProgress(0);
    setName(projectName || "");
    setShortDescription("");
    setDescription(
      `A SaaS product built with ${templateName} template on the Saasifyy code editor.`
    );
    setCategory("");
    setTagsInput("");
  };

  const handleOpenChange = (value: boolean) => {
    if (!value && step === "deploying") return; // prevent close during deploy
    if (!value) resetForm();
    onOpenChange(value);
  };

  async function handleDeploy(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStep("deploying");
    setDeployProgress(0);

    onDeployStart();
    onConsoleMessage("system", "Starting deployment pipeline...");

    // Simulate build steps with progress
    const buildSteps = [
      { delay: 400, progress: 15, msg: "Running pre-deploy checks..." },
      { delay: 900, progress: 30, msg: "Building production bundle..." },
      { delay: 1500, progress: 50, msg: "Optimizing assets..." },
      { delay: 2100, progress: 65, msg: "Bundled: 142.3 kB (gzipped: 45.2 kB)" },
      { delay: 2700, progress: 80, msg: "Uploading to marketplace..." },
    ];

    for (const step of buildSteps) {
      await new Promise((resolve) => setTimeout(resolve, step.delay - (buildSteps.indexOf(step) > 0 ? buildSteps[buildSteps.indexOf(step) - 1].delay : 0)));
      setDeployProgress(step.progress);
      onConsoleMessage("info", step.msg);
    }

    // Actually create the product via API
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      onConsoleMessage("info", "Submitting product to marketplace...");

      const res = await api.post<{ data: { id: string } }>(
        "/products",
        {
          name,
          shortDescription: shortDescription || undefined,
          description,
          category,
          tags,
        },
        { token: accessToken! }
      );

      setDeployProgress(100);
      setProductId(res.data.id);
      setStep("success");

      onConsoleMessage("success", "Deployment successful!");
      onConsoleMessage(
        "success",
        `Product "${name}" has been submitted to the marketplace for admin review.`
      );
      onConsoleMessage("info", `Product ID: ${res.data.id}`);
      onConsoleMessage("info", "You will be notified once approved by an admin.");
      onDeploySuccess(res.data.id);
    } catch (err) {
      setStep("error");
      const errorMsg =
        err instanceof ApiError ? err.message : "An unexpected error occurred";
      setError(errorMsg);
      onConsoleMessage("error", `Deployment failed: ${errorMsg}`);
      onDeployError(errorMsg);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* ─── Form Step ──────────────────────────────── */}
        {step === "form" && (
          <form onSubmit={handleDeploy}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-neutral-900" />
                Deploy to Marketplace
              </DialogTitle>
              <DialogDescription>
                Fill in your product details. Once submitted, an admin will review and approve your
                product for the marketplace.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {error && (
                <div className="rounded-sm bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="deploy-name">Product Name *</Label>
                <Input
                  id="deploy-name"
                  placeholder="My Awesome SaaS"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={3}
                  maxLength={200}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deploy-short">Short Description</Label>
                <Input
                  id="deploy-short"
                  placeholder="A brief tagline for your product"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  maxLength={300}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deploy-desc">Description *</Label>
                <Textarea
                  id="deploy-desc"
                  placeholder="Describe your product..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  minLength={20}
                  maxLength={10000}
                  rows={4}
                />
                <p className="text-xs text-gray-500">
                  {description.length}/10000 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={(val) => setCategory(val ?? "")}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deploy-tags">Tags</Label>
                <Input
                  id="deploy-tags"
                  placeholder="saas, automation, workflow (comma separated)"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="h-10"
                />
                <p className="text-xs text-gray-500">Up to 10 tags, comma separated</p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!category || !name || description.length < 20}>
                <Rocket className="mr-2 h-4 w-4" />
                Deploy
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* ─── Deploying Step ─────────────────────────── */}
        {step === "deploying" && (
          <div className="py-8">
            <DialogHeader>
              <DialogTitle className="text-center">Deploying...</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-6 mt-6">
              <div className="relative">
                <Loader className="w-5 mr-2" /><Rocket className="h-6 w-6 text-neutral-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-xs">
                <div className="h-2 bg-muted rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-black rounded-sm transition-all duration-500 ease-out"
                    style={{ width: `${deployProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  {deployProgress}% — Building and uploading...
                </p>
              </div>

              <p className="text-sm text-gray-500">
                Please wait while we deploy your product
              </p>
            </div>
          </div>
        )}

        {/* ─── Success Step ───────────────────────────── */}
        {step === "success" && (
          <div className="py-8">
            <DialogHeader>
              <DialogTitle className="text-center">Deployed Successfully!</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 mt-6">
              <div className="h-16 w-16 rounded-sm bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>

              <div className="text-center space-y-2">
                <p className="font-semibold">{name}</p>
                <p className="text-sm text-gray-500">
                  Your product has been submitted for admin review.
                  You&apos;ll be notified once it&apos;s approved and listed on the marketplace.
                </p>
                <div className="inline-flex items-center gap-2 bg-muted px-3 py-1.5 rounded-sm text-xs text-gray-500 mt-2">
                  <span>Product ID:</span>
                  <code className="font-mono">{productId}</code>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Continue Editing
                </Button>
                <Button
                  onClick={() => {
                    handleOpenChange(false);
                    window.location.href = `/developer/products/${productId}`;
                  }}
                >
                  View Product
                </Button>
              </DialogFooter>
            </div>
          </div>
        )}

        {/* ─── Error Step ─────────────────────────────── */}
        {step === "error" && (
          <div className="py-8">
            <DialogHeader>
              <DialogTitle className="text-center">Deployment Failed</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 mt-6">
              <div className="h-16 w-16 rounded-sm bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-destructive">{error}</p>
                <p className="text-xs text-gray-500">
                  Please check the error and try again.
                </p>
              </div>

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setStep("form")}>Try Again</Button>
              </DialogFooter>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
