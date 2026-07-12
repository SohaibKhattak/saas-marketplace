"use client";
import { Loader } from '@/components/ui/loader';

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
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

interface Transaction {
  id: string;
  amount: number;
  platformFee: number;
  developerAmount: number;
  type: string;
  status: string;
  createdAt: string;
  customer: { fullName: string; email: string };
  subscription: {
    product: { name: string };
    pricingPlan: { name: string };
  } | null;
}

export default function RevenuePage() {
  const { accessToken } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const limit = 20;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{
        data: Transaction[];
        pagination: { total: number };
      }>(`/developers/analytics/transactions?page=${page}&limit=${limit}`, { token: accessToken! });
      setTransactions(res.data);
      setTotal(res.pagination.total);
    } catch {
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Revenue</h1>
      <p className="text-gray-500 mt-1">
        Monitor your earnings and transaction history ({total} transactions)
      </p>

      {error && <div className="rounded-sm bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>All payments received from your subscribers</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex justify-center items-center text-gray-500"><Loader /></div>
          ) : transactions.length === 0 ? (
            <div className="rounded-sm border border-dashed p-12 text-center text-gray-500">
              No transactions yet. Revenue will appear here once you have paying subscribers.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Fee (15%)</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{tx.customer.fullName}</p>
                          <p className="text-xs text-gray-500">{tx.customer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{tx.subscription?.product.name ?? "—"}</TableCell>
                      <TableCell>{tx.subscription?.pricingPlan.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={tx.status === "SUCCEEDED" ? "default" : "destructive"}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">${tx.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-gray-500">${tx.platformFee.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-semibold tracking-tight">${tx.developerAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
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
