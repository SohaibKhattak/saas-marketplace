"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/image-upload";

const CATEGORIES = [
  "CRM", "Project Management", "Marketing", "Analytics", "E-Commerce",
  "Education", "Finance", "Healthcare", "Communication", "Productivity",
  "Developer Tools", "Other",
];

interface Site {
  id: string;
  subdomain: string;
  siteUrl: string;
  status: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [logoFiles, setLogoFiles] = useState<(File | string)[]>([]);
  const [screenshotFiles, setScreenshotFiles] = useState<(File | string)[]>([]);
  const [siteId, setSiteId] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sites, setSites] = useState<Site[]>([]);
  const [sitesLoaded, setSitesLoaded] = useState(false);

  useEffect(() => {
    api.get<{ data: Site[] }>("/wp/sites", { token: accessToken! })
      .then((res) => setSites(res.data.filter((s) => s.status === "ACTIVE")))
      .catch(() => { })
      .finally(() => setSitesLoaded(true));
  }, [accessToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (logoFiles.length === 0) throw new Error("Logo is required");

      if (screenshotFiles.length > 0 && (screenshotFiles.length < 5 || screenshotFiles.length > 8)) {
        throw new Error("Please provide between 5 and 8 screenshots if you choose to add any.");
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("category", category);
      if (siteId) formData.append("siteId", siteId);
      
      if (logoFiles[0] instanceof File) {
        formData.append("logo", logoFiles[0]);
      }
      
      screenshotFiles.forEach((file) => {
        if (file instanceof File) {
          formData.append("screenshots", file);
        }
      });

      const res = await api.post<{ data: { id: string } }>(
        "/products",
        formData,
        { token: accessToken! }
      );
      router.push(`/developer/products/${res.data.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Create New Product</h1>
      <p className="text-gray-500 mt-1">
        Set up your SaaS product listing for the marketplace
      </p>

      <div className="mt-4 rounded-lg bg-primary/10 p-4 border border-primary/20 flex items-center gap-3">
        <div className="bg-primary/20 p-2 rounded-full">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-primary">
          Pro tip: Adding a professional logo and screenshots can help you achieve your goals by increasing trust and conversions!
        </p>
      </div>

      <Card className="mt-6">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>
              Basic information about your product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="rounded-sm bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                placeholder="My Awesome SaaS"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={3}
                maxLength={200}
              />
            </div>

            <div className="space-y-4">
              <ImageUpload
                label="Product Logo *"
                value={logoFiles}
                onChange={setLogoFiles}
                maxFiles={1}
                description="Square PNG or JPG works best"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your product in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={20}
                maxLength={10000}
                rows={6}
              />
              <p className="text-xs text-gray-500">{description.length}/10000 characters</p>
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

            <div className="space-y-4 border-t pt-8">
              <ImageUpload
                label="Screenshots (Optional)"
                value={screenshotFiles}
                onChange={setScreenshotFiles}
                maxFiles={8}
                description="Upload 5-8 screenshots for best results"
              />
            </div>

            {sitesLoaded && sites.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <Label>Link WordPress Site *</Label>
                <Select value={siteId} onValueChange={(val) => setSiteId(val ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your WordPress site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.subdomain} — {site.siteUrl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Subscribers will get access to this WordPress site
                </p>
              </div>
            )}

            {sitesLoaded && sites.length === 0 && (
              <div className="rounded-sm border border-amber-500/50 bg-amber-500/10 p-4">
                <p className="text-sm font-semibold tracking-tight text-amber-700 dark:text-amber-400">No WordPress sites found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Create a WordPress site first, then link it to your product.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => router.push("/developer/sites")}
                >
                  Create WordPress Site
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !category}>
              {submitting ? "Creating..." : "Create Product"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
