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
import { Loader } from "@/components/ui/loader";
import { DollarSign, Wallet, AlertTriangle } from "lucide-react";

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
      fetchPayouts(); // refresh list
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update");
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto py-8 animate-fade-in space-y-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Manage <span className="bg-linear-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent">Payouts</span>
        </h1>
        <p className="text-lg text-gray-500">
          Manage developer earnings, balances, and payout schedules
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Developer Balances */}
      <Card className="border-0 shadow-lg ring-1 ring-gray-200/50 overflow-hidden transition-all">
        <CardHeader className="bg-gray-50/50 border-b px-6 py-5">
          <CardTitle className="text-xl flex items-center gap-2"><DollarSign className="h-5 w-5 text-gray-500" /> Developer Balances</CardTitle>
          <CardDescription>Outstanding amounts owed to developers</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {loadingSummary ? (
            <div className="py-16 flex justify-center items-center"><Loader /></div>
          ) : summary.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center text-gray-500 bg-gray-50/50">
              <p className="text-lg font-semibold tracking-tight text-gray-900">No developer earnings yet</p>
              <p className="text-sm mt-1">Earnings will appear here once developers make sales.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-gray-500">Developer</TableHead>
                    <TableHead className="text-right font-semibold text-gray-500">Total Earned</TableHead>
                    <TableHead className="text-right font-semibold text-gray-500">Total Paid</TableHead>
                    <TableHead className="text-right font-semibold text-gray-500">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.map((dev) => (
                    <TableRow key={dev.developerId} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{dev.developerName}</p>
                          <p className="text-xs text-gray-500">{dev.developerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-gray-600">${dev.totalEarned.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium text-gray-600">${dev.totalPaid.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold tracking-tight text-gray-900">
                        ${dev.balance.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card className="border-0 shadow-lg ring-1 ring-gray-200/50 overflow-hidden transition-all">
        <CardHeader className="bg-gray-50/50 border-b px-6 py-5">
          <CardTitle className="text-xl flex items-center gap-2"><Wallet className="h-5 w-5 text-gray-500" /> Payout History</CardTitle>
          <CardDescription>{total} payout records</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {loadingPayouts ? (
            <div className="py-16 flex justify-center items-center"><Loader /></div>
          ) : payouts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center text-gray-500 bg-gray-50/50">
              <p className="text-lg font-semibold tracking-tight text-gray-900">No payouts recorded yet</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-gray-500">Developer</TableHead>
                      <TableHead className="font-semibold text-gray-500">Period</TableHead>
                      <TableHead className="font-semibold text-gray-500">Status</TableHead>
                      <TableHead className="text-right font-semibold text-gray-500">Amount</TableHead>
                      {/* <TableHead className="text-right font-semibold text-gray-500">Actions</TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((p) => (
                      <TableRow key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="font-semibold tracking-tight text-gray-900">{p.developer.user.fullName}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(p.periodStart).toLocaleDateString()} — {new Date(p.periodEnd).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[p.status] ?? "secondary"} className="shadow-none rounded-md px-2.5">
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-gray-900">${p.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          {p.status === "PENDING" && (
                            <Button size="sm" variant="outline" className="rounded-md shadow-sm hover:shadow transition-all font-medium h-8" onClick={() => handleMarkStatus(p.id, "COMPLETED")}>
                              Mark Paid
                            </Button>
                          )}
                          {p.status === "PROCESSING" && (
                            <Button size="sm" variant="outline" className="rounded-md shadow-sm hover:shadow transition-all font-medium h-8" onClick={() => handleMarkStatus(p.id, "COMPLETED")}>
                              Complete
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <p className="text-sm font-medium text-gray-500">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-md shadow-sm hover:shadow transition-all" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" className="rounded-md shadow-sm hover:shadow transition-all" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
