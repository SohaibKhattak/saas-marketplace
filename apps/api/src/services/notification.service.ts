import { supabase } from "../config/supabase.js";

export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  const { data: inserted, error } = await supabase
    .from("notifications")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return inserted;
}

export async function getUserNotifications(userId: string, page: number, limit: number) {
  const fromRange = (page - 1) * limit;
  const toRange = fromRange + limit - 1;

  const [notificationsRes, totalRes, unreadRes] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: false })
      .range(fromRange, toRange),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("userId", userId),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("userId", userId)
      .eq("isRead", false),
  ]);

  if (notificationsRes.error) throw notificationsRes.error;
  if (totalRes.error) throw totalRes.error;
  if (unreadRes.error) throw unreadRes.error;

  return {
    notifications: notificationsRes.data || [],
    total: totalRes.count || 0,
    unreadCount: unreadRes.count || 0,
  };
}

export async function markAsRead(userId: string, notificationId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ isRead: true })
    .eq("id", notificationId)
    .eq("userId", userId);

  if (error) throw error;
  return data;
}

export async function markAllAsRead(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ isRead: true })
    .eq("userId", userId);

  if (error) throw error;
  return data;
}

export async function getUnreadCount(userId: string) {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("userId", userId)
    .eq("isRead", false);

  if (error) throw error;
  return count || 0;
}
