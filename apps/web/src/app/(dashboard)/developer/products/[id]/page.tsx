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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Trash2,
  Plus,
  Send,
  Globe,
  Pencil,
  Calendar,
  ArrowLeft,
  Users,
  MessageSquare,
  Sparkles,
  X,
  Loader2
} from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { ImageCarousel } from "@/components/marketplace/image-carousel";
import { Loader } from "@/components/ui/loader";

const CATEGORIES = [
  "CRM", "Project Management", "Marketing", "Analytics", "E-Commerce",
  "Education", "Finance", "Healthcare", "Communication", "Productivity",
  "Developer Tools", "Other",
];

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
  description: string;
  category: string;
  logoUrl: string | null;
  screenshots?: string[];
  status: string;
  rejectionReason: string | null;
  site: { site_url: string; subdomain: string } | null;
  pricingPlans: PricingPlan[];
  _count: { subscriptions: number; reviews: number };
  createdAt?: string;
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
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [logoFiles, setLogoFiles] = useState<(File | string)[]>([]);
  const [screenshotFiles, setScreenshotFiles] = useState<(File | string)[]>([]);

  const isChanged = product ? (
    name !== product.name ||
    description !== product.description ||
    category !== product.category ||
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

  // Unpublish modal
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);

  // Delete product modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(false);

  const fetchProduct = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get<{ data: Product }>(`/products/detail/${productId}`, {
        token: accessToken!,
      });
      setProduct(res.data);
      setName(res.data.name);
      setDescription(res.data.description);
      setCategory(res.data.category);
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

  // Enter edit mode and populate state from product data
  const handleStartEdit = () => {
    if (product) {
      setName(product.name);
      setDescription(product.description);
      setCategory(product.category);
      setLogoFiles(product.logoUrl ? [product.logoUrl] : []);
      setScreenshotFiles(product.screenshots || []);
      setIsEditing(true);
    }
  };

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
      formData.append("category", category);

      if (logoFiles[0] instanceof File) {
        formData.append("logo", logoFiles[0]);
      } else {
        formData.append("logoUrl", logoFiles[0] as string);
      }

      screenshotFiles.forEach((file) => {
        if (file instanceof File) {
          formData.append("screenshots", file);
        } else {
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
      if (product) {
        setProduct({ ...product, status: "PENDING_REVIEW" });
      }
      fetchProduct();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit");
    } finally {
      setReviewing(false);
    }
  }

  async function handleDeleteProduct() {
    setDeletingProduct(true);
    setError("");
    try {
      await api.delete(`/products/${productId}`, { token: accessToken! });
      router.push("/developer/products");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
      setDeletingProduct(false);
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
    return (
      <div className="flex min-h-100 flex-col items-center justify-center space-y-4">
        <Loader /><p className="text-sm text-gray-500">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-100 flex-col items-center justify-center space-y-4">
        <p className="text-lg font-medium text-gray-900">Product not found</p>
        <Button variant="outline" onClick={() => router.push("/developer/products")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
        </Button>
      </div>
    );
  }

  const canEdit = product.status === "DRAFT" || product.status === "REJECTED" || product.status === "UNPUBLISHED";
  const canSubmit = (product.status === "DRAFT" || product.status === "REJECTED" || product.status === "UNPUBLISHED") && product.pricingPlans.length > 0;
  const isPublished = product.status === "PUBLISHED";

  async function handleUnpublish() {
    setError("");
    setUnpublishing(true);
    try {
      await api.post(`/products/${productId}/unpublish`, {}, { token: accessToken! });
      setSuccess("Product unpublished from marketplace");
      setShowUnpublishModal(false);
      if (product) {
        setProduct({ ...product, status: "UNPUBLISHED" });
      }
      fetchProduct();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to unpublish");
    } finally {
      setUnpublishing(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      {/* Navigation & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/developer/products")} className="h-8 px-2">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-500 font-medium">Product Management</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit && !isEditing && (
            <Button variant="outline" size="sm" onClick={handleStartEdit} className="h-9 cursor-pointer ">
              <Pencil className="mr-2 h-4 w-4 text-black" /> Edit Details
            </Button>
          )}
          {canSubmit && (
            <Button size="sm" onClick={handleSubmitForReview} disabled={reviewing} className="h-9 cursor-pointer">
              {!reviewing && <Send className="mr-2 h-4 w-4" />}
              {reviewing ? <Loader2 className="w-5 mr-2 animate-spin" /> : "Submit for Review"}
            </Button>
          )}
          {isPublished && (
            <Button variant="outline" size="sm" onClick={() => setShowUnpublishModal(true)} className="h-9">
              Unpublish
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="h-9 flex items-center gap-2 px-3 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" /> Delete Product
          </Button>
        </div>
      </div>

      {product.rejectionReason && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 flex items-start gap-3">
          <div className="bg-destructive/10 p-2 rounded-full text-destructive">
            <X className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-destructive">Product Rejected</p>
            <p className="mt-1 text-sm text-destructive/80 leading-relaxed">{product.rejectionReason}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">{error}</div>
      )}
      {success && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 text-sm text-green-700 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Pro tip for edits */}
      {canEdit && !isEditing && (
        <div className="rounded-lg bg-green-500/10 p-4 border border-green-500/20 flex items-center gap-3">
          <p className="text-sm font-medium text-green-700">
            <span className="font-bold">Pro Tip:</span> Keep your product information updated. Make sure to upload between 5 to 8 screenshots for optimal conversions on the marketplace!
          </p>
        </div>
      )}

      {/* Main Content Grid */}
      {!isEditing ? (
        <div className="space-y-12">
          {/* Top Section: Split Layout (Logo + Info/Metrics) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
            {/* Left: Logo */}
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-[2.5rem] border border-gray-200 shadow-sm">
              <div
                className="relative w-full max-w-sm aspect-square rounded-[2rem] border-4 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center cursor-zoom-in hover:scale-[1.02] transition-transform duration-300"
                onClick={() => product.logoUrl && setActiveLightboxImage(product.logoUrl)}
              >
                {product.logoUrl ? (
                  <img
                    src={product.logoUrl}
                    alt={product.name}
                    className="h-full w-full object-contain p-6"
                  />
                ) : (
                  <span className="text-6xl font-extrabold text-gray-300 tracking-tight">{product.name.charAt(0)}</span>
                )}
              </div>
            </div>

            {/* Right: Info & Metrics */}
            <div className="flex flex-col h-full justify-center space-y-8 py-4">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={statusVariant[product.status] ?? "secondary"} className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full">
                    {product.status.replace("_", " ")}
                  </Badge>
                  <span className="inline-block px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-black border border-gray-200">
                    {product.category}
                  </span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">{product.name}</h1>
                {product.createdAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(product.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-5 rounded-3xl bg-gray-50 border border-gray-200 hover:scale-[1.02] transition-transform duration-200">
                  <div className="bg-black p-3.5 rounded-xl text-white shadow-md">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Subscribers</p>
                    <p className="text-3xl font-extrabold text-gray-950 mt-1">{product._count.subscriptions}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-5 rounded-3xl bg-gray-50 border border-gray-200 hover:scale-[1.02] transition-transform duration-200">
                  <div className="bg-black p-3.5 rounded-xl text-white shadow-md">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Reviews</p>
                    <p className="text-3xl font-extrabold text-gray-950 mt-1">{product._count.reviews}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Section: Image Carousel (Marketplace Style) */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 px-2">Product Gallery</h3>
            {product.screenshots && product.screenshots.length > 0 ? (
              <div className="w-full">
                <ImageCarousel images={product.screenshots} alt={product.name} />
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400 bg-gray-50">
                <p className="text-base font-semibold text-gray-700">No screenshots uploaded</p>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Upload screenshots in edit mode to display them here</p>
              </div>
            )}
          </div>

          {/* Bottom Section: Description & WP Site */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="border border-gray-200 shadow-sm rounded-3xl overflow-hidden h-full">
                <CardHeader className="border-b border-gray-100 bg-gray-50/50 p-6">
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">About the Product</h3>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {product.description || "No description provided."}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="border border-gray-200 shadow-sm rounded-3xl overflow-hidden h-full">
                <CardHeader className="p-6 pb-4 bg-gray-50/50 border-b border-gray-100">
                  <CardTitle className="text-lg font-bold text-gray-900 tracking-tight">WordPress Integration</CardTitle>
                  <CardDescription className="text-gray-500">Linked delivery site</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {product.site ? (
                    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-250">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white rounded-lg border shadow-sm">
                          <Globe className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <a
                            href={product.site.site_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-bold text-gray-900 hover:text-black hover:underline truncate block"
                          >
                            {product.site.site_url}
                          </a>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 font-medium pl-14">
                        Subdomain: <span className="text-gray-700">{product.site.subdomain}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No WordPress site linked to this product.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        /* Edit Mode - Form Based */
        <Card className="border border-gray-200 shadow-sm">
          <form onSubmit={handleSave}>
            <CardHeader className="border-b">
              <CardTitle className="text-xl">Edit Product Information</CardTitle>
              <CardDescription>
                Modify details for your product listing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={(val) => setCategory(val ?? "")}>
                  <SelectTrigger>
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
                <ImageUpload
                  label="Product Logo *"
                  value={logoFiles}
                  onChange={setLogoFiles}
                  maxFiles={1}
                  description="Square PNG or JPG works best (max 1)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">Description *</Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  required
                  minLength={20}
                />
              </div>

              <div className="space-y-2 pt-4 border-t">
                <ImageUpload
                  label="Screenshots"
                  value={screenshotFiles}
                  onChange={setScreenshotFiles}
                  maxFiles={8}
                  description="Upload between 5 and 8 screenshots for optimal conversions"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-6 bg-gray-50/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setName(product.name);
                  setDescription(product.description);
                  setCategory(product.category);
                  setLogoFiles(product.logoUrl ? [product.logoUrl] : []);
                  setScreenshotFiles(product.screenshots || []);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !isChanged}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Pricing Plans Section - Always Visible */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-gray-900">Pricing Plans</CardTitle>
                {isRefreshing && !loading && (
                  <Loader className="w-5 mr-2" />)}
              </div>
              <CardDescription>
                {product.pricingPlans.length === 0
                  ? "Add at least one pricing plan before submitting for review"
                  : `${product.pricingPlans.length} plan(s) available`}
              </CardDescription>
            </div>
            <Button size="sm" variant="default" onClick={() => setShowPlanDialog(true)} disabled={isRefreshing} className="h-9 group">
              <Plus className="mr-1 h-4 w-4 group-hover:scale-125 transition-all duration-200 cursor-pointer" /> Add Pricing Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative">
          {isRefreshing && !loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-b-lg">
              <Loader /></div>
          )}
          {product.pricingPlans.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed p-8 text-center text-gray-500 bg-gray-50">
              No pricing plans yet. Add one to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                        <span className="font-semibold text-gray-900">{plan.name}</span>
                        {!plan.isActive && (
                          <Badge variant="secondary" className="ml-2">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>${plan.price_monthly}/mo</TableCell>
                      <TableCell>{plan.price_yearly ? `$${plan.price_yearly}/yr` : "—"}</TableCell>
                      <TableCell>{plan.trial_days > 0 ? `${plan.trial_days} days` : "—"}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {plan.features.length} features
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setPlanToDelete(plan.id)} disabled={isRefreshing} className="h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="sm:max-w-106.25">
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
              <Button type="button" variant="outline" onClick={() => setShowPlanDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingPlan}>
                {savingPlan ? "Adding..." : "Add Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Confirm Dialog */}
      <Dialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <DialogContent className="sm:max-w-100">
          <DialogHeader>
            <DialogTitle>Delete Pricing Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this pricing plan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button type="button" variant="outline" onClick={() => setPlanToDelete(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={executeDeletePlan} disabled={deletingPlan}>
              {deletingPlan ? "Deleting..." : "Delete Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unpublish Confirm Dialog */}
      <Dialog open={showUnpublishModal} onOpenChange={setShowUnpublishModal}>
        <DialogContent className="sm:max-w-100">
          <DialogHeader>
            <DialogTitle>Unpublish Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to unpublish this product? It will be removed from the marketplace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button type="button" variant="outline" onClick={() => setShowUnpublishModal(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleUnpublish} disabled={unpublishing}>
              {unpublishing ? "Unpublishing..." : "Unpublish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirm Dialog */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-100">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button type="button" variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteProduct} disabled={deletingProduct}>
              {deletingProduct ? "Deleting..." : "Delete Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox Modal */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black/85 backdrop-blur-md transition-all duration-300"
          onClick={() => setActiveLightboxImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-white hover:text-gray-300 p-2.5 bg-black/40 hover:bg-black/60 rounded-full transition-all cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setActiveLightboxImage(null);
            }}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={activeLightboxImage}
            alt="Preview logo"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl transition-all scale-100"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
