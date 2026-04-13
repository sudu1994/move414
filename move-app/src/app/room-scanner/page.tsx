import { RoomScanner } from '@/components/dashboard/RoomScanner';
import { Scan } from 'lucide-react';

export const metadata = {
  title: 'Room Scanner',
  description: 'LiDAR-style room scanning to capture furniture dimensions and plan layouts',
};

export default function RoomScannerPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Scan size={18} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Room scanner</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          3Dスキャン・家具配置シミュレーター
        </p>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
          Simulate a LiDAR scan of your room. Capture item dimensions automatically,
          then drag furniture into your new floor plan before moving day.
        </p>
      </div>

      <RoomScanner />
    </div>
  );
}
