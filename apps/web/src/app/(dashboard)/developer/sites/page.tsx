"use client";

import { useState, useEffect, useCallback } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Globe, Plus } from "lucide-react";

interface Site {
  id: string;
  subdomain: string;
  wpSiteId: number | null;
  status: string;
  createdAt: string;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  PROVISIONING: "secondary",
  SUSPENDED: "destructive",
  DELETED: "outline",
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
      await api.post("/wp/sites", { subdomain }, { token: accessToken! });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WordPress Sites</h1>
          <p className="text-muted-foreground mt-1">Manage your hosted WordPress subsites</p>
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
                <DialogTitle>Provision WordPress Site</DialogTitle>
                <DialogDescription>
                  Create a new WordPress subsite for your SaaS product
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="subdomain"
                      placeholder="my-saas"
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value)}
                      required
                      pattern="[a-z0-9-]+"
                      title="Lowercase letters, numbers, and hyphens only"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">.platform.com</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Lowercase letters, numbers, and hyphens only
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating || !subdomain}>
                  {creating ? "Provisioning..." : "Create Site"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Sites</CardTitle>
          <CardDescription>{sites.length} WordPress site{sites.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : sites.length === 0 ? (
            <div className="py-12 text-center">
              <Globe className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No WordPress sites yet</p>
              <p className="text-sm text-muted-foreground">Provision your first site to start building your SaaS</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subdomain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>WP Site ID</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell className="font-medium">
                      {site.subdomain}.platform.com
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[site.status] ?? "secondary"}>
                        {site.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{site.wpSiteId ?? "—"}</TableCell>
                    <TableCell>{new Date(site.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
