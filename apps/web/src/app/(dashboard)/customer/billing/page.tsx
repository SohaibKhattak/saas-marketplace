"use client";

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
  currency: string;
  platformFee: number;
  status: string;
  type: string;
  createdAt: string;
  subscription: {
    product: { name: string; slug: string };
    pricingPlan: { name: string };
  } | null;
}

const statusVariant: Record<string, "default" | "destructive" | "secondary"> = {
  SUCCEEDED: "default",
  FAILED: "destructive",
  REFUNDED: "secondary",
};

export default function BillingPage() {
  const { accessToken } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{
        data: Transaction[];
        pagination: { total: number };
      }>(`/subscriptions/me/billing?page=${page}&limit=${limit}`, { token: accessToken! });
      setTransactions(res.data);
      setTotal(res.pagination.total);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [accessToken, page]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Billing History</h1>
      <p className="text-muted-foreground mt-1">View your payment history and invoices</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {total} transaction{total !== 1 ? "s" : ""} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              No billing history yet
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {tx.subscription?.product.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        {tx.subscription?.pricingPlan.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tx.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[tx.status] ?? "secondary"}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${tx.amount.toFixed(2)} {tx.currency.toUpperCase()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
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
