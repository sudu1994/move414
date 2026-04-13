'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatYen } from '@/lib/utils';

interface DataPoint {
  month: string;
  mrr: number;
  bookings: number;
}

interface RevenueChartProps {
  data: DataPoint[];
}

const MOCK_DATA: DataPoint[] = [
  { month: 'Jan', mrr: 198000,  bookings: 4  },
  { month: 'Feb', mrr: 396000,  bookings: 9  },
  { month: 'Mar', mrr: 792000,  bookings: 21 },
  { month: 'Apr', mrr: 1188000, bookings: 15 },
  { month: 'May', mrr: 1584000, bookings: 11 },
  { month: 'Jun', mrr: 1850000, bookings: 13 },
];

export function RevenueChart({ data = MOCK_DATA }: RevenueChartProps) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="font-semibold mb-4 text-sm">Monthly recurring revenue</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(v: number) => [formatYen(v), 'MRR']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.1)' }}
          />
          <Area
            type="monotone"
            dataKey="mrr"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#mrrGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
