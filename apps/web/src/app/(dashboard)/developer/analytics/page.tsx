"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Package, Users, DollarSign, CreditCard } from "lucide-react";

interface DevAnalytics {
  totalProducts: number;
  publishedProducts: number;
  totalSubscribers: number;
  totalRevenue: number;
  totalTransactions: number;
}

interface RevenueMonth {
  month: string;
  revenue: number;
  gross: number;
}

export default function AnalyticsPage() {
  const { accessToken } = useAuthStore();
  const [analytics, setAnalytics] = useState<DevAnalytics | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [aRes, rRes] = await Promise.all([
          api.get<{ data: DevAnalytics }>("/developers/analytics", { token: accessToken! }),
          api.get<{ data: RevenueMonth[] }>("/developers/analytics/revenue", { token: accessToken! }),
        ]);
        setAnalytics(aRes.data);
        setRevenueData(rRes.data);
      } catch {
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [accessToken]);

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading analytics...</div>;
  }

  if (error) {
    return <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>;
  }

  const kpiCards = analytics ? [
    { label: "Total Products", value: analytics.totalProducts, icon: Package },
    { label: "Published", value: analytics.publishedProducts, icon: Package },
    { label: "Active Subscribers", value: analytics.totalSubscribers, icon: Users },
    { label: "Total Revenue", value: `$${analytics.totalRevenue.toFixed(2)}`, icon: DollarSign },
    { label: "Transactions", value: analytics.totalTransactions, icon: CreditCard },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your product performance and subscriber metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
          <CardDescription>Your net revenue after platform fees (15%)</CardDescription>
        </CardHeader>
        <CardContent>
          {revenueData.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No revenue data yet</p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Bar dataKey="revenue" name="Net Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
