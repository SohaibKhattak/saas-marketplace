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
import { Trash2, Plus, Send, Globe, Pencil, Loader2, ImageIcon } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";

interface PricingPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number | null;
  features: string[];
  trial_days: number;
  isActive: boolean;
  sortOrder: number;
}

interface Product {
  id: string;
  name: string;
  // slug: string;
  // shortDescription: string | null;
  description: string;
  category: string;
  // tags: string[];
  logoUrl: string | null;
  screenshots?: string[];
  status: string;
  rejectionReason: string | null;
  site: { site_url: string; subdomain: string } | null;
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
  console.log(product)
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoFiles, setLogoFiles] = useState<(File | string)[]>([]);
  const [screenshotFiles, setScreenshotFiles] = useState<(File | string)[]>([]);

  const isChanged = product ? (
    name !== product.name || 
    description !== product.description || 
    logoFiles.some(f => f instanceof File) ||
    screenshotFiles.some(f => f instanceof File) ||
    logoFiles.length === 0 || // Removed logo
    screenshotFiles.length !== (product.screenshots?.length || 0) // Removed/Added screenshots
  ) : false;

  // Pricing plan dialog
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planMonthly, setPlanMonthly] = useState("");
  const [planYearly, setPlanYearly] = useState("");
  const [planFeatures, setPlanFeatures] = useState("");
  const [planTrialDays, setPlanTrialDays] = useState("0");
  const [savingPlan, setSavingPlan] = useState(false);
  
  // Delete plan dialog
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [deletingPlan, setDeletingPlan] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [reviewing, setReviewing] = useState(false);
  const fetchProduct = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get<{ data: Product }>(`/products/detail/${productId}`, {
        token: accessToken!,
      });
      setProduct(res.data);
      setName(res.data.name);
      setDescription(res.data.description);
      setLogoFiles(res.data.logoUrl ? [res.data.logoUrl] : []);
      setScreenshotFiles(res.data.screenshots || []);
    } catch {
      setError("Failed to load product");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
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
      if (logoFiles.length === 0) throw new Error("Logo is required");

      if (screenshotFiles.length > 0 && (screenshotFiles.length < 5 || screenshotFiles.length > 8)) {
        throw new Error("Please provide between 5 and 8 screenshots if you choose to add any.");
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      
      if (logoFiles[0] instanceof File) {
        formData.append("logo", logoFiles[0]);
      } else {
        formData.append("logoUrl", logoFiles[0] as string);
      }
      
      screenshotFiles.forEach((file) => {
        if (file instanceof File) {
          formData.append("screenshots", file);
        } else {
          // If we want to keep existing screenshots, we need a way to tell the backend.
          // For now, let's assume the backend replaces them all with what's sent.
          // We might need to send the URLs of existing screenshots we want to keep.
          formData.append("existingScreenshots", file);
        }
      });

      await api.patch(
        `/products/${productId}`,
        formData,
        { token: accessToken! }
      );
      setSuccess("Product updated successfully");
      setIsEditing(false);
      fetchProduct();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitForReview() {
    setError("");
    setSuccess("");
    setReviewing(true);
    try {
      await api.post(`/products/${productId}/submit`, {}, { token: accessToken! });
      setSuccess("Product submitted for review");
      fetchProduct();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit");
    }
      finally {
        setReviewing(false);
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

  async function executeDeletePlan() {
    if (!planToDelete) return;
    setDeletingPlan(true);
    setError("");
    
    try {
      await api.delete(`/products/plans/${planToDelete}`, { token: accessToken! });
      setPlanToDelete(null);
      fetchProduct();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete plan");
    } finally {
      setDeletingPlan(false);
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Loading...</div>;
  }

  if (!product) {
    return <div className="py-12 text-center text-gray-500">Product not found</div>;
  }

  const canEdit = product.status === "DRAFT" || product.status === "REJECTED";
  const canSubmit = (product.status === "DRAFT" || product.status === "REJECTED") && product.pricingPlans.length > 0;
  const isPublished = product.status === "PUBLISHED";

  async function handleUnpublish() {
    if (!confirm("Are you sure you want to unpublish this product? It will be removed from the marketplace.")) return;
    setError("");
    try {
      await api.post(`/products/${productId}/unpublish`, {}, { token: accessToken! });
      setSuccess("Product unpublished from marketplace");
      fetchProduct();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to unpublish");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={statusVariant[product.status] ?? "secondary"}>
              {product.status.replace("_", " ")}
            </Badge>
            <span className="text-sm text-gray-500">
              {product._count.subscriptions} subscribers
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {canSubmit && (
            <Button onClick={handleSubmitForReview} className={"cursor-pointer"}>
              <Send className="mr-2 h-4 w-4" />
              { !reviewing ? "Submit for Review" : <Loader2 className="animate-spin" /> }
            </Button>
          )}
          {isPublished && (
            <Button variant="outline" size="sm" onClick={handleUnpublish}>
              Unpublish
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteProduct}
            className="flex items-center gap-2 px-3 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {product.rejectionReason && (
        <div className="rounded-sm border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-sm font-semibold tracking-tight text-destructive">Rejection Reason</p>
          <p className="mt-1 text-sm text-destructive/80">{product.rejectionReason}</p>
        </div>
      )}

      {error && (
        <div className="rounded-sm bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}
      {success && (
        <div className="rounded-sm border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
          {success}
        </div>
      )}

      {canEdit && (
        <div className="rounded-lg bg-primary/10 p-4 border border-primary/20 flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-full">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-primary">
            Pro tip: Adding a professional logo and screenshots can help you achieve your goals by increasing trust and conversions!
          </p>
        </div>
      )}

      {/* Product Info */}
      <Card>
        <form onSubmit={handleSave}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product Information</CardTitle>
                <CardDescription>
                  {canEdit ? "Edit your product details" : "Product details (read-only while published/pending)"}
                </CardDescription>
              </div>
              {canEdit && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className={"cursor-pointer"}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Pencil className="h-4 w-4 text-green-600 hover:text-blue-500" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit || !isEditing} required minLength={3} />
            </div>

            <div className="space-y-4">
              <ImageUpload
                label="Logo"
                value={logoFiles}
                onChange={setLogoFiles}
                maxFiles={1}
                description="Square PNG or JPG works best"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} disabled={!canEdit || !isEditing} rows={6} required minLength={20} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={product.category} disabled />
            </div>

            <div className="space-y-4 border-t pt-8">
              <ImageUpload
                label="Screenshots"
                value={screenshotFiles}
                onChange={setScreenshotFiles}
                maxFiles={8}
                description="Upload 5-8 screenshots for best results"
              />
            </div>
            <div className="space-y-2">
              <Label>Linked WordPress Site</Label>
              {product.site ? (
                <div className="flex items-center gap-2 rounded-sm border p-3">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <a
                    href={product.site.site_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold tracking-tight text-neutral-900 hover:underline"
                  >
                    {product.site.site_url}
                  </a>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No WordPress site linked</p>
              )}
            </div>
          </CardContent>
          {canEdit && isEditing && (
            <CardFooter className="flex justify-end gap-2">
              <Button type="button" variant="outline"  className={"cursor-pointer" } onClick={() => {
                setIsEditing(false);
                setName(product?.name || "");
                setDescription(product?.description || "");
               
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !isChanged} className={"cursor-pointer"}>
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
              <div className="flex items-center gap-2">
                <CardTitle>Pricing Plans</CardTitle>
                {isRefreshing && !loading && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <CardDescription>
                {product.pricingPlans.length === 0
                  ? "Add at least one pricing plan before submitting for review"
                  : `${product.pricingPlans.length} plan(s)`}
              </CardDescription>
            </div>
            <Button size="sm" variant="default" onClick={() => setShowPlanDialog(true)} disabled={isRefreshing} className={"cursor-pointer" } >
              <Plus className="h-4 w-4" />
              Add Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative">
          {isRefreshing && !loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-b-lg">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {product.pricingPlans.length === 0 ? (
            <div className="rounded-sm border border-dashed p-8 text-center text-gray-500">
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
                      <span className="font-semibold tracking-tight">{plan.name}</span>
                      {!plan.isActive && (
                        <Badge variant="secondary" className="ml-2">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>${plan.price_monthly}/mo</TableCell>
                    <TableCell>{plan.price_yearly ? `$${plan.price_yearly}/yr` : "—"}</TableCell>
                    <TableCell>{plan.trial_days > 0 ? `${plan.trial_days} days` : "—"}</TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {(plan.features as string[]).length} features
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setPlanToDelete(plan.id)} disabled={isRefreshing} className={"cursor-pointer" } >
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
              <Button type="button" variant="outline" onClick={() => setShowPlanDialog(false)}  className={"cursor-pointer" } >
                Cancel
              </Button>
              <Button type="submit" disabled={savingPlan} className={"cursor-pointer" } >
                {savingPlan ? "Adding..." : "Add Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Confirm Dialog */}
      <Dialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pricing Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this pricing plan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPlanToDelete(null)} className="cursor-pointer">
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={executeDeletePlan} disabled={deletingPlan} className="cursor-pointer">
              {deletingPlan ? "Deleting..." : "Delete Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
