"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface PayoutSummary {
  developerId: string;
  developerName: string;
  developerEmail: string;
  totalEarned: number;
  totalPaid: number;
  balance: number;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  periodStart: string;
  periodEnd: string;
  processedAt: string | null;
  createdAt: string;
  developer: {
    user: { fullName: string; email: string };
  };
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "outline",
  PROCESSING: "secondary",
  COMPLETED: "default",
  FAILED: "destructive",
};

export default function PayoutsPage() {
  const { accessToken } = useAuthStore();
  const [summary, setSummary] = useState<PayoutSummary[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const limit = 20;

  useEffect(() => {
    async function loadSummary() {
      try {
        const res = await api.get<{ data: PayoutSummary[] }>("/admin/payouts/summary", { token: accessToken! });
        setSummary(res.data);
      } catch {
        setError("Failed to load payout summary");
      } finally { setLoadingSummary(false); }
    }
    loadSummary();
  }, [accessToken]);

  const fetchPayouts = useCallback(async () => {
    setLoadingPayouts(true);
    try {
      const res = await api.get<{
        data: Payout[];
        pagination: { total: number };
      }>(`/admin/payouts?page=${page}&limit=${limit}`, { token: accessToken! });
      setPayouts(res.data);
      setTotal(res.pagination.total);
    } catch {
      setError("Failed to load payouts");
    } finally { setLoadingPayouts(false); }
  }, [accessToken, page]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  async function handleMarkStatus(payoutId: string, status: "PROCESSING" | "COMPLETED" | "FAILED") {
    setError("");
    try {
      await api.patch(`/admin/payouts/${payoutId}/status`, { status }, { token: accessToken! });
      fetchPayouts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update");
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payouts</h1>
        <p className="text-muted-foreground mt-1">Manage developer payout schedules</p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Developer Balances */}
      <Card>
        <CardHeader>
          <CardTitle>Developer Balances</CardTitle>
          <CardDescription>Outstanding amounts owed to developers</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSummary ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : summary.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No developer earnings yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Developer</TableHead>
                  <TableHead className="text-right">Total Earned</TableHead>
                  <TableHead className="text-right">Total Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.map((dev) => (
                  <TableRow key={dev.developerId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{dev.developerName}</p>
                        <p className="text-xs text-muted-foreground">{dev.developerEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">${dev.totalEarned.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${dev.totalPaid.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${dev.balance.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>{total} payout records</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPayouts ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : payouts.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No payouts recorded yet</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Developer</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.developer.user.fullName}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(p.periodStart).toLocaleDateString()} — {new Date(p.periodEnd).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[p.status] ?? "secondary"}>{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">${p.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {p.status === "PENDING" && (
                          <Button size="sm" variant="outline" onClick={() => handleMarkStatus(p.id, "COMPLETED")}>
                            Mark Paid
                          </Button>
                        )}
                        {p.status === "PROCESSING" && (
                          <Button size="sm" variant="outline" onClick={() => handleMarkStatus(p.id, "COMPLETED")}>
                            Complete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
