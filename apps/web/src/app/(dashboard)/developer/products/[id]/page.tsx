"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Plus, Send, Globe } from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number | null;
  features: string[];
  trialDays: number;
  isActive: boolean;
  sortOrder: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string;
  category: string;
  tags: string[];
  logoUrl: string | null;
  screenshots: string[];
  status: string;
  rejectionReason: string | null;
  site: { siteUrl: string; subdomain: string } | null;
  pricingPlans: PricingPlan[];
  _count: { subscriptions: number; reviews: number };
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  PENDING_REVIEW: "outline",
  PUBLISHED: "default",
  REJECTED: "destructive",
  UNPUBLISHED: "secondary",
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit fields
  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // Pricing plan dialog
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planMonthly, setPlanMonthly] = useState("");
  const [planYearly, setPlanYearly] = useState("");
  const [planFeatures, setPlanFeatures] = useState("");
  const [planTrialDays, setPlanTrialDays] = useState("0");
  const [savingPlan, setSavingPlan] = useState(false);

  const fetchProduct = useCallback(async () => {
    try {
      const res = await api.get<{ data: Product }>(`/products/detail/${productId}`, {
        token: accessToken!,
      });
      setProduct(res.data);
      setName(res.data.name);
      setShortDescription(res.data.shortDescription ?? "");
      setDescription(res.data.description);
      setTagsInput(res.data.tags.join(", "));
    } catch {
      setError("Failed to load product");
    } finally {
      setLoading(false);
    }
  }, [productId, accessToken]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
      await api.patch(
        `/products/${productId}`,
        { name, shortDescription: shortDescription || undefined, description, tags },
        { token: accessToken! }
      );
      setSuccess("Product updated successfully");
      fetchProduct();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitForReview() {
    setError("");
    setSuccess("");
    try {
      await api.post(`/products/${productId}/submit`, {}, { token: accessToken! });
      setSuccess("Product submitted for review");
      fetchProduct();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit");
    }
  }

  async function handleDeleteProduct() {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`/products/${productId}`, { token: accessToken! });
      router.push("/developer/products");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    }
  }

  async function handleAddPlan(e: React.FormEvent) {
    e.preventDefault();
    setSavingPlan(true);
    setError("");

    try {
      const features = planFeatures.split("\n").map((f) => f.trim()).filter(Boolean);
      await api.post(
        `/products/${productId}/plans`,
        {
          name: planName,
          priceMonthly: parseFloat(planMonthly),
          priceYearly: planYearly ? parseFloat(planYearly) : undefined,
          features,
          trialDays: parseInt(planTrialDays) || 0,
        },
        { token: accessToken! }
      );
      setShowPlanDialog(false);
      setPlanName("");
      setPlanMonthly("");
      setPlanYearly("");
      setPlanFeatures("");
      setPlanTrialDays("0");
      fetchProduct();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add plan");
    } finally {
      setSavingPlan(false);
    }
  }

  async function handleDeletePlan(planId: string) {
    if (!confirm("Delete this pricing plan?")) return;
    try {
      await api.delete(`/products/plans/${planId}`, { token: accessToken! });
      fetchProduct();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete plan");
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
  }

  if (!product) {
    return <div className="py-12 text-center text-muted-foreground">Product not found</div>;
  }

  const canEdit = product.status === "DRAFT" || product.status === "REJECTED";
  const canSubmit = (product.status === "DRAFT" || product.status === "REJECTED") && product.pricingPlans.length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={statusVariant[product.status] ?? "secondary"}>
              {product.status.replace("_", " ")}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {product._count.subscriptions} subscribers
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {canSubmit && (
            <Button onClick={handleSubmitForReview}>
              <Send className="mr-2 h-4 w-4" />
              Submit for Review
            </Button>
          )}
          {canEdit && (
            <Button variant="destructive" size="sm" onClick={handleDeleteProduct}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {product.rejectionReason && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">Rejection Reason</p>
          <p className="mt-1 text-sm text-destructive/80">{product.rejectionReason}</p>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}
      {success && (
        <div className="rounded-md border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Product Info */}
      <Card>
        <form onSubmit={handleSave}>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>
              {canEdit ? "Edit your product details" : "Product details (read-only while published/pending)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} required minLength={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortDesc">Short Description</Label>
              <Input id="shortDesc" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} disabled={!canEdit} maxLength={300} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} disabled={!canEdit} rows={6} required minLength={20} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={product.category} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} disabled={!canEdit} placeholder="Comma separated" />
            </div>
            <div className="space-y-2">
              <Label>Linked WordPress Site</Label>
              {product.site ? (
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={product.site.siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {product.site.siteUrl}
                  </a>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No WordPress site linked</p>
              )}
            </div>
          </CardContent>
          {canEdit && (
            <CardFooter>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          )}
        </form>
      </Card>

      {/* Pricing Plans */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pricing Plans</CardTitle>
              <CardDescription>
                {product.pricingPlans.length === 0
                  ? "Add at least one pricing plan before submitting for review"
                  : `${product.pricingPlans.length} plan(s)`}
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowPlanDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {product.pricingPlans.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No pricing plans yet. Add one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Monthly</TableHead>
                  <TableHead>Yearly</TableHead>
                  <TableHead>Trial</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.pricingPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <span className="font-medium">{plan.name}</span>
                      {!plan.isActive && (
                        <Badge variant="secondary" className="ml-2">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>${plan.priceMonthly}/mo</TableCell>
                    <TableCell>{plan.priceYearly ? `$${plan.priceYearly}/yr` : "—"}</TableCell>
                    <TableCell>{plan.trialDays > 0 ? `${plan.trialDays} days` : "—"}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {(plan.features as string[]).length} features
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => handleDeletePlan(plan.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent>
          <form onSubmit={handleAddPlan}>
            <DialogHeader>
              <DialogTitle>Add Pricing Plan</DialogTitle>
              <DialogDescription>Create a new pricing tier for your product</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="planName">Plan Name *</Label>
                <Input id="planName" placeholder="e.g., Basic, Pro, Enterprise" value={planName} onChange={(e) => setPlanName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="planMonthly">Monthly Price ($) *</Label>
                  <Input id="planMonthly" type="number" min="0" step="0.01" placeholder="9.99" value={planMonthly} onChange={(e) => setPlanMonthly(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="planYearly">Yearly Price ($)</Label>
                  <Input id="planYearly" type="number" min="0" step="0.01" placeholder="99.99" value={planYearly} onChange={(e) => setPlanYearly(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="planTrialDays">Trial Days</Label>
                <Input id="planTrialDays" type="number" min="0" max="30" value={planTrialDays} onChange={(e) => setPlanTrialDays(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planFeatures">Features (one per line)</Label>
                <Textarea id="planFeatures" placeholder="Unlimited projects&#10;Priority support&#10;Custom domain" value={planFeatures} onChange={(e) => setPlanFeatures(e.target.value)} rows={4} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPlanDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={savingPlan}>
                {savingPlan ? "Adding..." : "Add Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
