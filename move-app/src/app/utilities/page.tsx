import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { UtilitiesForm } from '@/components/forms/utilities-form';

export const metadata = { title: 'Utilities Setup' };

export default async function UtilitiesPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/auth/login');
  const user = await db.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!user) redirect('/auth/login');

  const requests = await db.utilityRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Utilities setup</h1>
        <p className="text-muted-foreground text-sm mt-1">光熱費・インターネット開設手続き</p>
        <p className="text-sm text-muted-foreground mt-2">
          Tell us what you need and we will handle all the calls in Japanese on your behalf.
          <br />
          <span className="text-primary font-medium">ガス・電気・水道・インターネットの開設を代行します。</span>
        </p>
      </div>

      {requests.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">PREVIOUS REQUESTS</h2>
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{r.city} · {r.utilityType}</p>
                  <p className="text-xs text-muted-foreground">
                    Move-in: {new Date(r.moveInDate).toLocaleDateString()}
                    {r.completedSteps.length > 0 && ` · Done: ${r.completedSteps.join(', ')}`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  r.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  r.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <UtilitiesForm userId={user.id} userLanguage={user.language} />
    </div>
  );
}
