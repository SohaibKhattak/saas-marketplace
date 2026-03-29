"use client";

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
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleSuspend(userId: string, suspend: boolean) {
    try {
      await api.patch(
        `/admin/users/${userId}/suspend`,
        { suspend },
        { token: accessToken! }
      );
      fetchUsers();
    } catch {
      // Silently fail
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
    <div>
      <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
      <p className="text-muted-foreground mt-1">
        Manage platform users and permissions ({total} total)
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Search, filter, and manage user accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex items-center gap-3">
            <form onSubmit={handleSearch} className="flex flex-1 gap-2">
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
              <Button type="submit" variant="outline" size="sm">
                Search
              </Button>
            </form>
            <Select value={roleFilter} onValueChange={(val) => { setRoleFilter(val ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="DEVELOPER">Developer</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : users.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              No users found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{u.fullName}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(u.role)}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {u.isSuspended ? (
                            <Badge variant="destructive">Suspended</Badge>
                          ) : (
                            <Badge variant="outline">Active</Badge>
                          )}
                          {!u.emailVerified && (
                            <Badge variant="secondary" className="text-xs">Unverified</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {u.role !== "ADMIN" && (
                          <Button
                            size="sm"
                            variant={u.isSuspended ? "outline" : "destructive"}
                            onClick={() => handleSuspend(u.id, !u.isSuspended)}
                          >
                            {u.isSuspended ? "Unsuspend" : "Suspend"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
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
    </div>
  );
}
