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
import { Loader } from "@/components/ui/loader";

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

  const kpiCards = [
    { label: "Total Users", value: kpis?.totalUsers, icon: Users },
    { label: "Developers", value: kpis?.totalDevelopers, icon: Users },
    { label: "Published Products", value: kpis?.publishedProducts, icon: Package },
    { label: "Active Subscriptions", value: kpis?.activeSubscriptions, icon: CreditCard },
    { label: "Total Revenue", value: kpis ? `$${kpis.totalRevenue.toFixed(2)}` : null, icon: DollarSign },
    { label: "Platform Revenue", value: kpis ? `$${kpis.platformRevenue.toFixed(2)}` : null, icon: DollarSign },
    { label: "Pending Applications", value: kpis?.pendingApplications, icon: FileCheck },
    { label: "Pending Products", value: kpis?.pendingProducts, icon: ShieldCheck },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-8 animate-fade-in">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Platform <span className="bg-linear-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent">Analytics</span>
        </h1>
        <p className="text-lg text-gray-500">
          Monitor platform health and growth metrics
        </p>
      </div>

      {error && (
        <div className="rounded-sm bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} className="border-0 shadow-lg ring-1 ring-gray-200/50 transition-all hover:shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold tracking-tight text-gray-500">
                {kpi.label}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 flex items-center"><Loader /></div>
              ) : (
                <p className="text-2xl font-bold">{kpi.value ?? "0"}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card className="border-0 shadow-lg ring-1 ring-gray-200/50">
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
          <CardDescription>Revenue breakdown over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full flex items-center justify-center">
            {loading ? (
              <Loader />
            ) : revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dx={-10} />
                  <Tooltip
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                    cursor={{ fill: '#F3F4F6' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="platformFee" name="Platform Fee" fill="#111827" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="developerPayout" name="Developer Payout" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">No revenue data yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="border-0 shadow-lg ring-1 ring-gray-200/50">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Last 10 transactions on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader />
            </div>
          ) : recentTx.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-gray-500">Date</TableHead>
                    <TableHead className="font-semibold text-gray-500">Customer</TableHead>
                    <TableHead className="font-semibold text-gray-500">Developer</TableHead>
                    <TableHead className="font-semibold text-gray-500">Product</TableHead>
                    <TableHead className="font-semibold text-gray-500">Status</TableHead>
                    <TableHead className="text-right font-semibold text-gray-500">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTx.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-gray-50/50">
                      <TableCell className="text-gray-600">{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium text-gray-900">{tx.customer.fullName}</TableCell>
                      <TableCell className="text-gray-600">{tx.developer.user.fullName}</TableCell>
                      <TableCell className="text-gray-600">{tx.subscription?.product.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={tx.status === "SUCCEEDED" ? "default" : "destructive"} className="shadow-none rounded-sm px-2.5">
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold tracking-tight text-gray-900">${tx.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
