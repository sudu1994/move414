'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Textarea } from '@/components/ui/form-elements';
import { toast } from '@/components/ui/toaster';
import { formatYen, cn } from '@/lib/utils';

const CATEGORIES = ['Furniture','Appliance','Electronics','Clothing','Books','Sports','Other'];
const CONDITIONS = [
  { value: 'excellent', label: 'Excellent — like new', est: '70-90%' },
  { value: 'good',      label: 'Good — minor wear',    est: '40-60%' },
  { value: 'fair',      label: 'Fair — visible wear',  est: '20-35%' },
  { value: 'poor',      label: 'Poor — damaged',       est: '5-15%' },
];
const PARTNERS = [
  { id: 'hard-off',  name: 'Hard Off',  logo: 'HO', note: 'Electronics, furniture, instruments' },
  { id: 'eco-ring',  name: 'Eco Ring',  logo: 'ER', note: 'Luxury goods, branded items' },
  { id: 'book-off',  name: 'Book Off',  logo: 'BO', note: 'Books, media, small items' },
];

interface RecycleItem {
  itemName: string;
  category: string;
  condition: string;
  description: string;
  estimatedValue: number | '';
}

export default function RecyclePage() {
  const router = useRouter();
  const [items, setItems] = useState<RecycleItem[]>([
    { itemName: '', category: '', condition: '', description: '', estimatedValue: '' },
  ]);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [loading, setLoading] = useState(false);

  function addItem() {
    if (items.length >= 10) return;
    setItems((prev) => [...prev, { itemName: '', category: '', condition: '', description: '', estimatedValue: '' }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof RecycleItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  const totalEstimate = items.reduce((sum, item) => {
    const val = typeof item.estimatedValue === 'number' ? item.estimatedValue : 0;
    const cond = CONDITIONS.find((c) => c.value === item.condition);
    if (!cond || !val) return sum;
    const pct = parseInt(cond.est.split('-')[0]) / 100;
    return sum + Math.round(val * pct);
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validItems = items.filter((i) => i.itemName && i.category && i.condition);
    if (validItems.length === 0) {
      toast({ title: 'Add at least one item', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/recycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: validItems, partnerId: selectedPartner }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({ title: 'Items submitted!', description: 'Our recycle partner will contact you within 2 days.', variant: 'success' });
      router.push('/dashboard');
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Recycle your items</h1>
        <p className="text-muted-foreground text-sm mt-1">不要品のリサイクル・売却</p>
        <p className="text-sm text-muted-foreground mt-2">
          List items you want to sell or donate at move-out.
          We connect you with our partner recycle shops and handle the pickup.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Partner selection */}
        <div>
          <Label className="text-base font-semibold">Choose a recycle partner</Label>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {PARTNERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPartner(p.id)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center',
                  selectedPartner === p.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40'
                )}
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                  {p.logo}
                </div>
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{p.note}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Items list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-semibold">Items to recycle</Label>
            {items.length < 10 && (
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus size={14} /> Add item
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Item {idx + 1}</p>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Item name 商品名</Label>
                    <Input placeholder="IKEA bookshelf" className="mt-1"
                      value={item.itemName} onChange={(e) => updateItem(idx, 'itemName', e.target.value)} />
                  </div>
                  <div>
                    <Label>Category カテゴリ</Label>
                    <Select onValueChange={(v) => updateItem(idx, 'category', v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Condition 状態</Label>
                    <Select onValueChange={(v) => updateItem(idx, 'condition', v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {CONDITIONS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Est. original price (¥)</Label>
                    <Input type="number" placeholder="15000" className="mt-1"
                      value={item.estimatedValue}
                      onChange={(e) => updateItem(idx, 'estimatedValue', parseInt(e.target.value) || '')} />
                  </div>
                </div>
                <div>
                  <Label>Description 説明（任意）</Label>
                  <Textarea placeholder="Age, brand, any defects..." className="mt-1"
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estimate */}
        {totalEstimate > 0 && (
          <div className="rounded-xl border bg-green-50 border-green-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Estimated payout</p>
                <p className="text-xs text-green-600 mt-0.5">Based on item condition · Final value set by partner</p>
              </div>
              <p className="text-xl font-bold text-green-800">{formatYen(totalEstimate)}</p>
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          <RefreshCcw size={16} /> Submit items for recycling
        </Button>
      </form>
    </div>
  );
}
