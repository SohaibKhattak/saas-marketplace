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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [siteId, setSiteId] = useState("");
  const [sites, setSites] = useState<Site[]>([]);
  const [sitesLoaded, setSitesLoaded] = useState(false);

  useEffect(() => {
    api.get<{ data: Site[] }>("/wp/sites", { token: accessToken! })
      .then((res) => setSites(res.data.filter((s) => s.status === "ACTIVE")))
      .catch(() => {})
      .finally(() => setSitesLoaded(true));
  }, [accessToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await api.post<{ data: { id: string } }>(
        "/products",
        {
          name,
          shortDescription: shortDescription || undefined,
          description,
          category,
          tags,
          siteId: siteId || undefined,
        },
        { token: accessToken! }
      );
      router.push(`/developer/products/${res.data.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
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

      <Card className="mt-6">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>
              Basic information about your product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input
                id="shortDescription"
                placeholder="A brief tagline for your product"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                maxLength={300}
              />
              <p className="text-xs text-gray-500">{shortDescription.length}/300 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your product in detail. What problems does it solve? What features does it offer?"
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

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="saas, automation, workflow (comma separated)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
              <p className="text-xs text-gray-500">Up to 10 tags, comma separated</p>
            </div>

            {sitesLoaded && sites.length > 0 && (
              <div className="space-y-2">
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
          <CardFooter className="flex justify-between">
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
