import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { AdminSidebar } from '@/components/layout/admin-sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/auth/login');

  const dbUser = await db.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!dbUser || dbUser.role !== 'ADMIN') redirect('/dashboard');

  return <AdminSidebar>{children}</AdminSidebar>;
}
