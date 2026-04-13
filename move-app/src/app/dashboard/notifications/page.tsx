import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { formatDateTime } from '@/lib/utils';
import { Bell, CheckCheck } from 'lucide-react';

export const metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/auth/login');

  const user = await db.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!user) redirect('/auth/login');

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={async () => {
            'use server';
            await db.notification.updateMany({
              where: { userId: user.id, isRead: false },
              data: { isRead: true },
            });
          }}>
            <button type="submit" className="flex items-center gap-2 text-sm text-primary hover:underline">
              <CheckCheck size={14} /> Mark all read
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell size={40} className="mx-auto mb-3 opacity-30" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border px-4 py-3.5 flex items-start gap-3 transition-colors ${
                !n.isRead ? 'bg-primary/5 border-primary/20' : 'bg-card'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.isRead ? 'bg-primary' : 'bg-transparent'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                <p className="text-xs text-muted-foreground mt-1.5">{formatDateTime(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
