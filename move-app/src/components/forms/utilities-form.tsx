'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Flame, Droplets, Wifi, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Textarea } from '@/components/ui/form-elements';
import { toast } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { PREFECTURES } from '@/lib/types';

const UTILITY_OPTIONS = [
  { id: 'GAS',         label: 'Gas',         labelJa: 'ガス',       icon: Flame,       color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { id: 'ELECTRICITY', label: 'Electricity', labelJa: '電気',       icon: Zap,         color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { id: 'WATER',       label: 'Water',       labelJa: '水道',       icon: Droplets,    color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'INTERNET',    label: 'Internet',    labelJa: 'インターネット', icon: Wifi,     color: 'text-purple-600 bg-purple-50 border-purple-200' },
];

interface UtilitiesFormProps {
  userId: string;
  userLanguage?: string;
}

export function UtilitiesForm({ userId, userLanguage = 'EN' }: UtilitiesFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState({
    address: '', prefecture: '', city: '', postalCode: '',
    moveInDate: '', gasProvider: '', elecProvider: '',
    internetType: '', notes: '', preferredContact: 'email',
  });

  function toggleUtil(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function setField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0) {
      toast({ title: 'Select at least one utility', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/utilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, services: selected, userId, language: userLanguage }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({
        title: 'Request submitted!',
        description: 'We will handle the setup and update you within 2 business days.',
        variant: 'success',
      });
      router.push('/dashboard');
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Something went wrong', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Select utilities */}
      <div>
        <Label className="text-base font-semibold">Which utilities do you need?</Label>
        <p className="text-xs text-muted-foreground mb-3">必要なサービスを選んでください（複数選択可）</p>
        <div className="grid grid-cols-2 gap-3">
          {UTILITY_OPTIONS.map(({ id, label, labelJa, icon: Icon, color }) => {
            const active = selected.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleUtil(id)}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
                  active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                )}
              >
                <div className={cn('p-2 rounded-lg', active ? 'bg-primary/10 text-primary' : color)}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{labelJa}</p>
                </div>
                {active && <CheckSquare size={16} className="text-primary ml-auto" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* New address */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">New address 新住所</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="postalCode">Postal code 〒</Label>
            <Input id="postalCode" placeholder="123-4567" className="mt-1"
              value={form.postalCode} onChange={(e) => setField('postalCode', e.target.value)} required />
          </div>
          <div>
            <Label>Prefecture 都道府県</Label>
            <Select onValueChange={(v) => setField('prefecture', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {PREFECTURES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="city">City 市区町村</Label>
          <Input id="city" placeholder="Shinjuku-ku" className="mt-1"
            value={form.city} onChange={(e) => setField('city', e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="address">Street address 番地</Label>
          <Input id="address" placeholder="1-2-3 Kabukicho, APT 301" className="mt-1"
            value={form.address} onChange={(e) => setField('address', e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="moveInDate">Move-in date 入居日</Label>
          <Input id="moveInDate" type="date" className="mt-1"
            value={form.moveInDate} onChange={(e) => setField('moveInDate', e.target.value)} required />
        </div>
      </div>

      {/* Provider preferences */}
      {(selected.includes('GAS') || selected.includes('ELECTRICITY') || selected.includes('INTERNET')) && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Provider preferences (optional)</Label>
          {selected.includes('GAS') && (
            <div>
              <Label htmlFor="gasProvider">Gas provider</Label>
              <Input id="gasProvider" placeholder="Tokyo Gas / leave blank for default"
                className="mt-1" value={form.gasProvider} onChange={(e) => setField('gasProvider', e.target.value)} />
            </div>
          )}
          {selected.includes('ELECTRICITY') && (
            <div>
              <Label htmlFor="elecProvider">Electric provider</Label>
              <Input id="elecProvider" placeholder="TEPCO / leave blank for default"
                className="mt-1" value={form.elecProvider} onChange={(e) => setField('elecProvider', e.target.value)} />
            </div>
          )}
          {selected.includes('INTERNET') && (
            <div>
              <Label>Internet type</Label>
              <Select onValueChange={(v) => setField('internetType', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fiber">Fiber optic (光回線) — recommended</SelectItem>
                  <SelectItem value="cable">Cable</SelectItem>
                  <SelectItem value="5g_home">5G Home router</SelectItem>
                  <SelectItem value="any">No preference</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Contact preference */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">How should we update you?</Label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'email', label: 'Email' },
            { value: 'phone', label: 'Phone call' },
            { value: 'sms',   label: 'SMS' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setField('preferredContact', opt.value)}
              className={cn(
                'py-2 rounded-lg border text-sm font-medium transition-colors',
                form.preferredContact === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/40'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Additional notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="Any special instructions, preferred time for inspection, etc."
          className="mt-1"
          value={form.notes}
          onChange={(e) => setField('notes', e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" size="lg" loading={loading}>
        Submit utility request
      </Button>
    </form>
  );
}
