"use client";
import { Loader } from '@/components/ui/loader';

import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
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
import { FileText, Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

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
  const [submittingAction, setSubmittingAction] = useState<"APPROVED" | "REJECTED" | null>(null);
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
    setSubmittingAction(status);
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

      // Update local state instead of full fetch for smooth UX
      setApplications(prev => prev.filter(app => app.id !== reviewingApp.id));
      setTotal(prev => prev - 1);

      setReviewingApp(null);
      setRejectionReason("");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to submit review");
      }
    } finally {
      setSubmittingAction(null);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto py-8 animate-fade-in space-y-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Developer <span className="bg-linear-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent">Applications</span>
        </h1>
        <p className="text-lg text-gray-500">
          Review and approve pending developer applications ({total} pending)
        </p>
      </div>

      <Card className="border-0 shadow-lg ring-1 ring-gray-200/50 overflow-hidden transition-all">
        <CardHeader className="bg-gray-50/50 border-b px-6 py-5">
          <CardTitle className="text-xl flex items-center gap-2"><FileText className="h-5 w-5 text-gray-500" /> Pending Applications</CardTitle>
          <CardDescription>
            Approve or reject developer applications to grant marketplace access
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="py-16 flex justify-center items-center"><Loader /></div>
          ) : applications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center text-gray-500 bg-gray-50/50">
              <p className="text-lg font-semibold tracking-tight text-gray-900">No pending applications</p>
              <p className="text-sm mt-1">You're all caught up!</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-gray-500">Applicant</TableHead>
                      <TableHead className="font-semibold text-gray-500">Business</TableHead>
                      <TableHead className="font-semibold text-gray-500">Email</TableHead>
                      <TableHead className="font-semibold text-gray-500">Applied</TableHead>
                      <TableHead className="text-right font-semibold text-gray-500">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow key={app.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell>
                          <div>
                            <p className="font-semibold tracking-tight text-gray-900">{app.user.fullName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{app.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">{app.businessName}</TableCell>
                        <TableCell className="text-gray-600">{app.businessEmail}</TableCell>
                        <TableCell className="text-gray-600 font-medium">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-md shadow-sm hover:shadow transition-all"
                            onClick={() => setReviewingApp(app)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <p className="text-sm font-medium text-gray-500">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-md shadow-sm hover:shadow transition-all"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-md shadow-sm hover:shadow transition-all"
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
          if (!open && !submittingAction) {
            setReviewingApp(null);
            setRejectionReason("");
            setError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-137.5 p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-linear-to-br from-primary/10 via-background to-background p-6 border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ring-4 ring-primary/5">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight">Review Application</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  Review the developer application from <strong className="text-foreground">{reviewingApp?.user.fullName}</strong>
                </DialogDescription>
              </div>
            </div>
          </div>

          {reviewingApp && (
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="rounded-xl border bg-gray-50/50 p-4 space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm font-medium text-gray-500">Applicant</span>
                  <span className="text-sm font-semibold text-gray-900">{reviewingApp.user.fullName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-gray-200/50">
                  <span className="text-sm font-medium text-gray-500">Personal Email</span>
                  <span className="text-sm text-gray-900">{reviewingApp.user.email}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-gray-200/50">
                  <span className="text-sm font-medium text-gray-500">Business Name</span>
                  <span className="text-sm font-semibold text-gray-900">{reviewingApp.businessName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-gray-200/50">
                  <span className="text-sm font-medium text-gray-500">Business Email</span>
                  <span className="text-sm text-gray-900">{reviewingApp.businessEmail}</span>
                </div>
                {reviewingApp.taxId && (
                  <div className="flex justify-between items-center py-1 border-t border-gray-200/50">
                    <span className="text-sm font-medium text-gray-500">Tax ID</span>
                    <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-0.5 rounded">{reviewingApp.taxId}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1 border-t border-gray-200/50">
                  <span className="text-sm font-medium text-gray-500">Applied On</span>
                  <span className="text-sm text-gray-900">
                    {new Date(reviewingApp.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {reviewingApp.bio && (
                  <div className="pt-2 border-t border-gray-200/50">
                    <span className="text-sm font-medium text-gray-500">Bio / Description</span>
                    <p className="mt-2 text-sm text-gray-700 bg-white p-3 rounded-lg border shadow-sm leading-relaxed">{reviewingApp.bio}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="rejectionReason" className="text-sm font-semibold text-gray-700">Rejection Reason <span className="text-gray-400 font-normal">(Optional, if rejecting)</span></Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Provide a reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="resize-none rounded-lg focus-visible:ring-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="bg-gray-50 dark:bg-white/5 p-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between items-center border-t">
            <Button
              variant="outline"
              className="text-gray-500 hover:text-gray-900 rounded-md w-full sm:w-auto"
              onClick={() => setReviewingApp(null)}
              disabled={submittingAction !== null}
            >
              Cancel
            </Button>
            <div className="flex w-full sm:w-auto gap-3 flex-col sm:flex-row">
              <Button
                variant="outline"
                className="rounded-md border-red-200 bg-red-500/10 text-red-600 hover:bg-red-500/20 hover:text-red-700 w-full sm:w-auto"
                onClick={() => handleReview("REJECTED")}
                disabled={submittingAction !== null}
              >
                {submittingAction === "REJECTED" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
              </Button>
              <Button
                variant="outline"
                className="rounded-md border-green-200 bg-green-500/10 text-green-700 hover:bg-green-500/20 hover:text-green-800 w-full sm:w-auto font-medium"
                onClick={() => handleReview("APPROVED")}
                disabled={submittingAction !== null}
              >
                {submittingAction === "APPROVED" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
