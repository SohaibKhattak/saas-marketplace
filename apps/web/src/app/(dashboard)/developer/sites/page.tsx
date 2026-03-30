"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Globe,
  Plus,
  ExternalLink,
  Settings,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Rocket,
} from "lucide-react";

interface Site {
  id: string;
  subdomain: string;
  siteUrl: string;
  wpSiteId: number | null;
  status: string;
  createdAt: string;
}

const WP_DOMAIN = "saasifyy.tech";

const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  ACTIVE: { variant: "default", label: "Active" },
  PROVISIONING: { variant: "secondary", label: "Provisioning..." },
  SUSPENDED: { variant: "destructive", label: "Suspended" },
  DELETED: { variant: "outline", label: "Deleted" },
};

export default function SitesPage() {
  const { accessToken } = useAuthStore();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [subdomain, setSubdomain] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchSites = useCallback(async () => {
    try {
      const res = await api.get<{ data: Site[] }>("/wp/sites", { token: accessToken! });
      setSites(res.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  async function handleProvision(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      await api.post("/wp/sites", { subdomain: subdomain.toLowerCase() }, { token: accessToken! });
      setSubdomain("");
      setDialogOpen(false);
      fetchSites();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to provision site");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/developer/products" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">WordPress Sites</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WordPress Sites</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your no-code WordPress sites
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={<Button />}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Site
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleProvision}>
              <DialogHeader>
                <DialogTitle>Create WordPress Site</DialogTitle>
                <DialogDescription>
                  Launch a new WordPress site for your SaaS product. You&apos;ll get a fully hosted WordPress environment with your own subdomain.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Site Name</Label>
                  <div className="flex items-center">
                    <Input
                      id="subdomain"
                      placeholder="my-saas-app"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      required
                      className="rounded-r-none"
                    />
                    <span className="inline-flex items-center px-3 h-9 rounded-r-md border border-l-0 border-input bg-muted text-sm text-muted-foreground">
                      .{WP_DOMAIN}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Lowercase letters, numbers, and hyphens only (3-32 characters)
                  </p>
                  {subdomain && (
                    <p className="text-xs text-primary">
                      Your site will be available at: <strong>https://{subdomain}.{WP_DOMAIN}</strong>
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating || subdomain.length < 3}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Site...
                    </>
                  ) : (
                    <>
                      <Rocket className="mr-2 h-4 w-4" />
                      Create Site
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sites Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading your sites...</p>
        </div>
      ) : sites.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
              <Globe className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">No WordPress sites yet</h3>
            <p className="text-muted-foreground mt-1 max-w-md mx-auto">
              Create your first WordPress site to start building your SaaS product with no code.
              You&apos;ll get a fully hosted WordPress environment with themes, plugins, and WooCommerce.
            </p>
            <Button className="mt-6" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Site
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => {
            const config = statusConfig[site.status] ?? { variant: "secondary" as const, label: site.status };
            const siteUrl = `https://${site.subdomain}.${WP_DOMAIN}`;
            const adminUrl = `https://${site.subdomain}.${WP_DOMAIN}/wp-admin`;

            return (
              <Card key={site.id} className="hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                        <Globe className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{site.subdomain}</CardTitle>
                        <CardDescription className="text-xs">.{WP_DOMAIN}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Created</span>
                      <span>{new Date(site.createdAt).toLocaleDateString()}</span>
                    </div>
                    {site.wpSiteId && (
                      <div className="flex justify-between">
                        <span>WP Site ID</span>
                        <span>#{site.wpSiteId}</span>
                      </div>
                    )}
                  </div>

                  {site.status === "ACTIVE" && (
                    <div className="flex gap-2">
                      <a href={siteUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                          View Site
                        </Button>
                      </a>
                      <a href={adminUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button size="sm" className="w-full">
                          <Settings className="mr-1.5 h-3.5 w-3.5" />
                          WP Admin
                        </Button>
                      </a>
                    </div>
                  )}

                  {site.status === "PROVISIONING" && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Setting up your WordPress site...</span>
                    </div>
                  )}

                  {site.status === "SUSPENDED" && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-lg p-3">
                      <AlertCircle className="h-4 w-4" />
                      <span>Site creation failed. Please try again.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Add New Site Card */}
          <Card
            className="border-dashed hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center min-h-[200px]"
            onClick={() => setDialogOpen(true)}
          >
            <CardContent className="text-center py-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mx-auto mb-3">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Create New Site</p>
              <p className="text-xs text-muted-foreground mt-1">Add another WordPress site</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
