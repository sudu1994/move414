import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { SidebarLayout } from '@/components/layout/sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/auth/login');

  // Upsert user in DB on every layout render (safe, idempotent)
  const user = await db.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || undefined,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
      avatarUrl: clerkUser.imageUrl,
    },
    create: {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
      name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || undefined,
      avatarUrl: clerkUser.imageUrl,
    },
    include: { subscription: true },
  });

  return (
    <SidebarLayout
      userName={user.name ?? clerkUser.firstName ?? 'User'}
      planType={user.subscription?.planType}
    >
      {children}
    </SidebarLayout>
  );
}
