"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationList() {
  const { accessToken } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await api.get<{
        data: Notification[];
        pagination: { total: number };
      }>(`/notifications?page=${page}&limit=${limit}`, { token: accessToken });
      setNotifications(res.data);
      setTotal(res.pagination.total);
    } catch {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page]);

  useEffect(() => {
    // fetchNotifications();
  }, [fetchNotifications]);

  async function handleMarkAllRead() {
    if (!accessToken) return;
    try {
      await api.post("/notifications/read-all", {}, { token: accessToken });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  }

  async function handleMarkRead(id: string) {
    if (!accessToken) return;
    try {
      await api.post(`/notifications/${id}/read`, {}, { token: accessToken });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  }

  const totalPages = Math.ceil(total / limit);
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-gray-500 mt-1">{total} notification{total !== 1 ? "s" : ""}</p>
        </div>
        {hasUnread && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-sm bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {loading ? (
        <div className="mt-8 py-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-neutral-900" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="mt-8 rounded-sm border border-dashed p-12 text-center text-gray-500">
          <Bell className="mx-auto h-12 w-12 text-gray-500/40" />
          <p className="mt-4 text-lg font-semibold tracking-tight">No notifications yet</p>
          <p className="mt-1 text-sm">You&apos;ll see updates about your subscriptions and products here.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {notifications.map((notif) => {
            const content = (
              <Card
                key={notif.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${!notif.isRead ? "border-primary/30 bg-gray-100" : ""}`}
                onClick={() => !notif.isRead && handleMarkRead(notif.id)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!notif.isRead && (
                          <span className="h-2 w-2 rounded-sm bg-black shrink-0" />
                        )}
                        <p className="text-sm font-semibold tracking-tight truncate">{notif.title}</p>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">{notif.message}</p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );

            return notif.link ? (
              <Link key={notif.id} href={notif.link} onClick={() => !notif.isRead && handleMarkRead(notif.id)}>
                {content}
              </Link>
            ) : (
              <div key={notif.id}>{content}</div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
