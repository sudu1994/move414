'use client';
import { useEffect, useState, useCallback } from 'react';

export interface BookingData {
  id: string;
  status: string;
  fromCity: string;
  toCity: string;
  fromAddress: string;
  toAddress: string;
  roomSize: string;
  moveDate: string;
  moveTimeSlot: string;
  totalCost: number;
  customerPays: number;
  coveredByPlan: boolean;
  isPeakSeason: boolean;
  createdAt: string;
}

export function useBookings() {
  const [data, setData] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    setLoading(true);
    fetch('/api/bookings')
      .then((r) => r.json())
      .then((j) => setData(j.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { data, loading, refetch };
}
