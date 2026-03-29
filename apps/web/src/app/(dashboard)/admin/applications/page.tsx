"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Application {
  id: string;
  businessName: string;
  businessEmail: string;
  taxId: string | null;
  bio: string | null;
  applicationStatus: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    createdAt: string;
  };
}

export default function ApplicationsPage() {
  const { accessToken } = useAuthStore();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [reviewingApp, setReviewingApp] = useState<Application | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{
        data: Application[];
        pagination: { total: number };
      }>(`/admin/developers/applications?page=${page}&limit=${limit}`, {
        token: accessToken!,
      });
      setApplications(res.data);
      setTotal(res.pagination.total);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [accessToken, page]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  async function handleReview(status: "APPROVED" | "REJECTED") {
    if (!reviewingApp) return;
    setSubmitting(true);
    setError("");

    try {
      await api.patch(
        `/admin/developers/${reviewingApp.id}/review`,
        {
          status,
          rejectionReason: status === "REJECTED" ? rejectionReason : undefined,
        },
        { token: accessToken! }
      );
      setReviewingApp(null);
      setRejectionReason("");
      fetchApplications();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to submit review");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Developer Applications</h1>
      <p className="text-muted-foreground mt-1">
        Review and approve pending developer applications ({total} pending)
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pending Applications</CardTitle>
          <CardDescription>
            Approve or reject developer applications to grant marketplace access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : applications.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              No pending applications
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{app.user.fullName}</p>
                          <p className="text-xs text-muted-foreground">{app.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{app.businessName}</TableCell>
                      <TableCell>{app.businessEmail}</TableCell>
                      <TableCell>
                        {new Date(app.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReviewingApp(app)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog
        open={!!reviewingApp}
        onOpenChange={(open) => {
          if (!open) {
            setReviewingApp(null);
            setRejectionReason("");
            setError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
            <DialogDescription>
              Review the developer application from {reviewingApp?.user.fullName}
            </DialogDescription>
          </DialogHeader>

          {reviewingApp && (
            <div className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Applicant</span>
                  <span className="text-sm font-medium">{reviewingApp.user.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Personal Email</span>
                  <span className="text-sm">{reviewingApp.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Business Name</span>
                  <span className="text-sm font-medium">{reviewingApp.businessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Business Email</span>
                  <span className="text-sm">{reviewingApp.businessEmail}</span>
                </div>
                {reviewingApp.taxId && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tax ID</span>
                    <span className="text-sm">{reviewingApp.taxId}</span>
                  </div>
                )}
                {reviewingApp.bio && (
                  <div>
                    <span className="text-sm text-muted-foreground">Bio</span>
                    <p className="mt-1 text-sm">{reviewingApp.bio}</p>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">User Since</span>
                  <span className="text-sm">
                    {new Date(reviewingApp.user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Rejection Reason (if rejecting)</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Provide a reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => handleReview("REJECTED")}
              disabled={submitting}
            >
              {submitting ? "..." : "Reject"}
            </Button>
            <Button
              onClick={() => handleReview("APPROVED")}
              disabled={submitting}
            >
              {submitting ? "..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
