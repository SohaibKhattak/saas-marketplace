"use client";
import { Loader } from '@/components/ui/loader';

import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, UserCog, AlertCircle, Loader2, AlertTriangle } from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  fullName: string;
  role: string;
  emailVerified: boolean;
  isSuspended: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const { accessToken } = useAuthStore();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [error, setError] = useState("");
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [suspendingUserIds, setSuspendingUserIds] = useState<Record<string, boolean>>({});
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);

      const res = await api.get<{
        data: UserItem[];
        pagination: { total: number };
      }>(`/admin/users?${params}`, { token: accessToken! });
      setUsers(res.data);
      setTotal(res.pagination.total);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleSuspend(userId: string, suspend: boolean) {
    setSuspendingUserIds(prev => ({ ...prev, [userId]: true }));
    try {
      await api.patch(
        `/admin/users/${userId}/suspend`,
        { suspend },
        { token: accessToken! }
      );
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: suspend } : u));
    } catch {
      setError("Failed to update user status");
    } finally {
      setSuspendingUserIds(prev => ({ ...prev, [userId]: false }));
    }
  }

  async function handleDelete() {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deletingUser.id}`, { token: accessToken! });
      setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
      setTotal(prev => prev - 1);
      setDeletingUser(null);
    } catch {
      setError("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  }

  const totalPages = Math.ceil(total / limit);

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive" as const;
      case "DEVELOPER":
        return "default" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 animate-fade-in space-y-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          User <span className="bg-linear-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent">Management</span>
        </h1>
        <p className="text-lg text-gray-500">
          Manage platform users and permissions ({total} total)
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Card className="border-0 shadow-lg ring-1 ring-gray-200/50 overflow-hidden transition-all">
        <CardHeader className="bg-gray-50/50 border-b px-6 py-5">
          <CardTitle className="text-xl flex items-center gap-2"><UserCog className="h-5 w-5 text-gray-500" /> All Users</CardTitle>
          <CardDescription>
            Search, filter, and manage user accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
            <form onSubmit={handleSearch} className="flex flex-1 gap-2 w-full">
              <div className="relative flex-1 rounded-full bg-white border border-gray-300 group focus-within:border-gray-500 focus-within:shadow-[0_0_0_2px_rgba(0,0,0,0.05)] transition-all duration-300 overflow-hidden h-12 flex items-center max-w-lg">
                <div className="absolute inset-0 bg-black/10 origin-left scale-x-0 transition-transform duration-300 ease-in-out group-focus-within:scale-x-100 pointer-events-none" />
                <Search className="absolute left-4 h-5 w-5 text-gray-500 pointer-events-none z-10 transition-colors duration-300 group-focus-within:text-black" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-full pl-12 pr-4 bg-transparent border-none text-gray-900 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 relative z-10 font-medium text-base shadow-none"
                />
              </div>
            </form>
            <Select value={roleFilter} onValueChange={(val) => { setRoleFilter(val ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40 h-12 border-gray-300 rounded-full bg-white text-gray-900 text-sm hover:border-gray-400 transition-colors focus:ring-black/10">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                <SelectItem value="all" className="text-sm">All Roles</SelectItem>
                <SelectItem value="CUSTOMER" className="text-sm">Customer</SelectItem>
                <SelectItem value="DEVELOPER" className="text-sm">Developer</SelectItem>
                <SelectItem value="ADMIN" className="text-sm">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center items-center"><Loader /></div>
          ) : users.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center text-gray-500 bg-gray-50/50">
              <p className="text-lg font-semibold tracking-tight text-gray-900">No users found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-gray-500">User</TableHead>
                      <TableHead className="font-semibold text-gray-500">Role</TableHead>
                      <TableHead className="font-semibold text-gray-500">Status</TableHead>
                      <TableHead className="font-semibold text-gray-500">Joined</TableHead>
                      <TableHead className="text-right font-semibold text-gray-500">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell>
                          <div>
                            <p className="font-semibold tracking-tight text-gray-900">{u.fullName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{u.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={roleBadgeVariant(u.role)} className="shadow-none rounded-md px-2.5">
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-1.5">
                            {u.isSuspended ? (
                              <Badge variant="destructive" className="shadow-none rounded-md px-2.5 bg-red-100 text-red-700 hover:bg-red-200">Suspended</Badge>
                            ) : (
                              <Badge variant="outline" className="shadow-none rounded-md px-2.5 text-green-700 border-green-200 bg-green-50">Active</Badge>
                            )}
                            {!u.emailVerified && (
                              <Badge variant="secondary" className="text-[10px] shadow-none rounded-md uppercase tracking-wider font-bold">Unverified</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 font-medium">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {u.role !== "ADMIN" && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant={u.isSuspended ? "outline" : "secondary"}
                                className={`rounded-md shadow-sm transition-all ${u.isSuspended ? "hover:bg-green-50 hover:text-green-700 hover:border-green-600" : "hover:bg-amber-50 hover:text-amber-700 hover:border-amber-600"}`}
                                onClick={() => handleSuspend(u.id, !u.isSuspended)}
                                disabled={suspendingUserIds[u.id]}
                              >
                                {suspendingUserIds[u.id] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : u.isSuspended ? "Unsuspend" : "Suspend"}
                              </Button>
                              <Button
                                size="sm"
                                className="rounded-md bg-red-50 text-red-600 border border-transparent hover:bg-transparent hover:border-red-600 hover:text-red-700 transition-all shadow-none font-medium"
                                onClick={() => setDeletingUser(u)}
                              >
                                Delete
                              </Button>
                            </div>
                          )}
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingUser}
        onOpenChange={(open) => { if (!open) setDeletingUser(null); }}
      >
        <DialogContent className="sm:max-w-112.5 p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-red-50/80 backdrop-blur-md p-6 border-b border-red-100/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-red-500/10 blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 ring-4 ring-red-500/5">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-red-700">Delete User Account</DialogTitle>
              </div>
            </div>
          </div>
          <div className="p-6">
            <DialogDescription className="text-base text-gray-600">
              Are you sure you want to permanently delete <strong>{deletingUser?.fullName}</strong> ({deletingUser?.email})?
              <br /><br />
              This will remove all their data including subscriptions, reviews, and transactions. <strong>This action cannot be undone.</strong>
            </DialogDescription>
          </div>
          <DialogFooter className="bg-gray-50 dark:bg-white/5 p-6 border-t gap-2 sm:justify-between flex flex-col-reverse sm:flex-row">
            <Button variant="ghost" className="rounded-md font-semibold text-gray-600 hover:text-gray-900 w-full sm:w-auto" onClick={() => setDeletingUser(null)}>
              Cancel
            </Button>
            <Button
              className="rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold transition-all w-full sm:w-auto shadow-md"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
