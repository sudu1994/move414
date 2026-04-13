'use client';
import { useEffect, useState } from 'react';

export interface SubscriptionData {
  id: string;
  planType: string;
  status: string;
  monthlyPrice: number;
  contractStartDate: string;
  contractEndDate: string;
  nextMoveEligibleDate: string;
  movesUsed: number;
  movesAllowed: number;
  maxDistanceKm: number;
}

export function useSubscription() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/subscriptions')
      .then((r) => r.json())
      .then((j) => setData(j.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const canMove =
    data?.status === 'ACTIVE' &&
    data.movesUsed < data.movesAllowed &&
    new Date() >= new Date(data.nextMoveEligibleDate);

  return { data, loading, error, canMove };
}
