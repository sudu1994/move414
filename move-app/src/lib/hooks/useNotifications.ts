'use client';
import { useEffect, useState, useCallback } from 'react';

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [data, setData] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((j) => setData(j.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' });
    setData((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  const unreadCount = data.filter((n) => !n.isRead).length;

  return { data, loading, unreadCount, markAllRead, refetch };
}
