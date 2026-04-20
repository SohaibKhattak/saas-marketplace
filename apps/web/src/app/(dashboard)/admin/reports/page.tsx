"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download } from "lucide-react";

interface ReportData {
  csv: string;
  count: number;
  totals: {
    amount: number;
    platformFee: number;
    developerAmount: number;
  };
}

export default function ReportsPage() {
  const { accessToken } = useAuthStore();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setReport(null);

    try {
      const res = await api.get<{ data: ReportData }>(
        `/admin/reports?startDate=${startDate}&endDate=${endDate}`,
        { token: accessToken! }
      );
      setReport(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!report) return;
    const blob = new Blob([report.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-report-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-gray-500 mt-1">Generate and export financial reports</p>
      </div>

      <Card className="max-w-lg">
        <form onSubmit={handleGenerate}>
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>
              Select a date range to generate a financial report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-sm bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading || !startDate || !endDate}>
              {loading ? "Generating..." : "Generate Report"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {report && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Report Results</CardTitle>
                <CardDescription>
                  {report.count} transaction{report.count !== 1 ? "s" : ""} from {startDate} to {endDate}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-sm border p-4 text-center">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold">${report.totals.amount.toFixed(2)}</p>
              </div>
              <div className="rounded-sm border p-4 text-center">
                <p className="text-sm text-gray-500">Platform Fees</p>
                <p className="text-2xl font-bold">${report.totals.platformFee.toFixed(2)}</p>
              </div>
              <div className="rounded-sm border p-4 text-center">
                <p className="text-sm text-gray-500">Developer Payouts</p>
                <p className="text-2xl font-bold">${report.totals.developerAmount.toFixed(2)}</p>
              </div>
            </div>

            {report.count > 0 && (
              <div className="mt-4 max-h-64 overflow-auto rounded-sm border bg-muted/50 p-4">
                <pre className="text-xs whitespace-pre">{report.csv}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
