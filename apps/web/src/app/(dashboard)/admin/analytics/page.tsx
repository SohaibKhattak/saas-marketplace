"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Users, Package, CreditCard, DollarSign, FileCheck, ShieldCheck } from "lucide-react";

interface KPIs {
  totalUsers: number;
  totalDevelopers: number;
  totalProducts: number;
  publishedProducts: number;
  activeSubscriptions: number;
  totalRevenue: number;
  platformRevenue: number;
  pendingApplications: number;
  pendingProducts: number;
}

interface RevenueMonth {
  month: string;
  revenue: number;
  platformFee: number;
  developerPayout: number;
}

interface RecentTx {
  id: string;
  amount: number;
  platformFee: number;
  type: string;
  status: string;
  createdAt: string;
  customer: { fullName: string };
  developer: { user: { fullName: string } };
  subscription: { product: { name: string } } | null;
}

export default function PlatformAnalyticsPage() {
  const { accessToken } = useAuthStore();
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueMonth[]>([]);
  const [recentTx, setRecentTx] = useState<RecentTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [kpiRes, revRes, txRes] = await Promise.all([
          api.get<{ data: KPIs }>("/admin/analytics", { token: accessToken! }),
          api.get<{ data: RevenueMonth[] }>("/admin/analytics/revenue", { token: accessToken! }),
          api.get<{ data: RecentTx[] }>("/admin/analytics/transactions", { token: accessToken! }),
        ]);
        setKpis(kpiRes.data);
        setRevenueData(revRes.data);
        setRecentTx(txRes.data);
      } catch {
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [accessToken]);

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Loading analytics...</div>;
  }

  if (error) {
    return <div className="rounded-sm bg-destructive/10 p-3 text-sm text-destructive">{error}</div>;
  }

  const kpiCards = kpis ? [
    { label: "Total Users", value: kpis.totalUsers, icon: Users },
    { label: "Developers", value: kpis.totalDevelopers, icon: Users },
    { label: "Published Products", value: kpis.publishedProducts, icon: Package },
    { label: "Active Subscriptions", value: kpis.activeSubscriptions, icon: CreditCard },
    { label: "Total Revenue", value: `$${kpis.totalRevenue.toFixed(2)}`, icon: DollarSign },
    { label: "Platform Revenue", value: `$${kpis.platformRevenue.toFixed(2)}`, icon: DollarSign },
    { label: "Pending Applications", value: kpis.pendingApplications, icon: FileCheck },
    { label: "Pending Products", value: kpis.pendingProducts, icon: ShieldCheck },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Analytics</h1>
        <p className="text-gray-500 mt-1">Monitor platform health and growth metrics</p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold tracking-tight text-gray-500">
                {kpi.label}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      {revenueData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Revenue breakdown over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="platformFee" name="Platform Fee" fill="hsl(var(--primary))" />
                  <Bar dataKey="developerPayout" name="Developer Payout" fill="hsl(var(--muted-foreground))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Last 10 transactions on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTx.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No transactions yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Developer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTx.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{tx.customer.fullName}</TableCell>
                    <TableCell>{tx.developer.user.fullName}</TableCell>
                    <TableCell>{tx.subscription?.product.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={tx.status === "SUCCEEDED" ? "default" : "destructive"}>
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold tracking-tight">${tx.amount.toFixed(2)}</TableCell>
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
