"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, FileText, Calendar, DollarSign, Activity, AlertTriangle } from "lucide-react";
import { Loader } from "@/components/ui/loader";

function parseCSV(csvText: string) {
  if (!csvText) return { headers: [], rows: [] };
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map(v => v.replace(/^"(.*)"$/, '$1'));
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

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

  const { defaultStartDate, defaultEndDate } = useMemo(() => {
    const today = new Date();
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(today.getDate() - 10);
    return {
      defaultStartDate: tenDaysAgo.toISOString().split('T')[0],
      defaultEndDate: today.toISOString().split('T')[0],
    };
  }, []);

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const parsedReport = useMemo(() => {
    return report ? parseCSV(report.csv) : { headers: [], rows: [] };
  }, [report]);

  const generateReport = useCallback(async (start: string, end: string) => {
    if (!start || !end) return;
    setError("");
    setLoading(true);
    setReport(null);

    try {
      const res = await api.get<{ data: ReportData }>(
        `/admin/reports?startDate=${start}&endDate=${end}`,
        { token: accessToken! }
      );
      setReport(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      generateReport(defaultStartDate, defaultEndDate);
    }
  }, [accessToken, generateReport, defaultStartDate, defaultEndDate]);

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    generateReport(startDate, endDate);
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
    <div className="max-w-7xl mx-auto py-8 animate-fade-in space-y-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          System <span className="bg-linear-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent">Reports</span>
        </h1>
        <p className="text-lg text-gray-500">
          Generate, view, and export financial and activity reports
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Configuration */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-lg ring-1 ring-gray-200/50 overflow-hidden transition-all sticky top-24">
            <form onSubmit={handleGenerate}>
              <CardHeader className="bg-gray-50/50 border-b px-6 py-5">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  Report Criteria
                </CardTitle>
                <CardDescription>
                  Select a date range to aggregate data
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="font-semibold text-gray-700">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="h-12 border-gray-300 focus-visible:ring-black/10 focus-visible:border-gray-500 shadow-sm rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="font-semibold text-gray-700">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="h-12 border-gray-300 focus-visible:ring-black/10 focus-visible:border-gray-500 shadow-sm rounded-lg"
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50/50 border-t px-6 py-4">
                <Button
                  type="submit"
                  disabled={loading || !startDate || !endDate}
                  className="w-full h-11 bg-black text-white hover:bg-gray-900 rounded-lg shadow-sm font-semibold transition-all"
                >
                  {loading ? "Generating..." : "Generate Report"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Report Results */}
        <div className="lg:col-span-2 space-y-6">
          {loading && !report ? (
            <Card className="border-0 shadow-lg ring-1 ring-gray-200/50 overflow-hidden min-h-100 flex justify-center items-center">
              <Loader />
            </Card>
          ) : report ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-0 shadow-md ring-1 ring-gray-200/50 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2 text-gray-500">
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                      </div>
                      <p className="text-sm font-medium">Total Revenue</p>
                    </div>
                    <p className="text-3xl font-bold tracking-tight text-gray-900">
                      ${report.totals.amount.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md ring-1 ring-gray-200/50 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2 text-gray-500">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium">Platform Fees</p>
                    </div>
                    <p className="text-3xl font-bold tracking-tight text-gray-900">
                      ${report.totals.platformFee.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md ring-1 ring-gray-200/50 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2 text-gray-500">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <FileText className="h-4 w-4 text-purple-600" />
                      </div>
                      <p className="text-sm font-medium">Dev Payouts</p>
                    </div>
                    <p className="text-3xl font-bold tracking-tight text-gray-900">
                      ${report.totals.developerAmount.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Data Preview */}
              <Card className="border-0 shadow-lg ring-1 ring-gray-200/50 overflow-hidden transition-all">
                <CardHeader className="bg-gray-50/50 border-b px-6 py-5 flex flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gray-500" />
                      Report Data
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {report.count} transaction{report.count !== 1 ? "s" : ""} from {startDate} to {endDate}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    className="shrink-0 h-10 px-4 rounded-lg shadow-sm font-medium"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {report.count > 0 ? (
                    <div className="max-h-125 overflow-auto border-t border-gray-100">
                      <Table>
                        <TableHeader className="bg-gray-50/80 sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                          <TableRow className="border-gray-100">
                            {parsedReport.headers.map((h, i) => (
                              <TableHead key={i} className="font-semibold text-gray-700 whitespace-nowrap bg-gray-50/95 backdrop-blur-sm px-6">
                                {h}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedReport.rows.map((row, i) => (
                            <TableRow key={i} className="hover:bg-gray-50/50 transition-colors border-gray-100">
                              {row.map((cell, j) => (
                                <TableCell key={j} className="text-gray-600 whitespace-nowrap px-6 py-3 font-medium">
                                  {cell}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-gray-500 bg-gray-50/30">
                      <FileText className="h-10 w-10 text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-900">No data available</p>
                      <p className="text-sm mt-1">There were no transactions in this period.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-0 shadow-lg ring-1 ring-gray-200/50 overflow-hidden min-h-100 flex flex-col justify-center items-center text-gray-500 bg-gray-50/30 p-6 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-xl font-medium text-gray-900">Ready to Generate</p>
              <p className="text-sm mt-2 max-w-md">
                Select your date range and click generate to view the financial breakdown.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
