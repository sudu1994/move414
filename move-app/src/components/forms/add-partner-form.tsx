'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/form-elements';
import { toast } from '@/components/ui/toaster';

const PREFS = ['Tokyo','Kanagawa','Osaka','Aichi','Saitama','Chiba','Hyogo','Fukuoka'];

export function AddPartnerForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: '', companyName: '', email: '',
    phone: '', maxDistanceKm: 30, truckCount: 1, contractRate: 40000,
  });

  function setField(k: string, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function togglePref(p: string) {
    setSelectedPrefs((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedPrefs.length === 0) {
      toast({ title: 'Select at least one prefecture', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, prefecture: selectedPrefs, cities: [] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast({ title: 'Partner added!', variant: 'success' });
      router.refresh();
      setForm({ name: '', companyName: '', email: '', phone: '', maxDistanceKm: 30, truckCount: 1, contractRate: 40000 });
      setSelectedPrefs([]);
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {[
        { id: 'name',        label: 'Contact name',   placeholder: 'Tanaka San' },
        { id: 'companyName', label: 'Company name',   placeholder: '田中引越センター' },
        { id: 'email',       label: 'Email',          placeholder: 'contact@example.com' },
        { id: 'phone',       label: 'Phone',          placeholder: '03-1234-5678' },
      ].map(({ id, label, placeholder }) => (
        <div key={id}>
          <Label htmlFor={id} className="text-xs">{label}</Label>
          <Input id={id} placeholder={placeholder} className="mt-1 h-8 text-sm"
            value={(form as any)[id]}
            onChange={(e) => setField(id, e.target.value)}
            required
          />
        </div>
      ))}

      <div className="grid grid-cols-3 gap-2">
        {[
          { id: 'truckCount',     label: 'Trucks', min: 1 },
          { id: 'maxDistanceKm',  label: 'Max km', min: 5 },
          { id: 'contractRate',   label: 'Rate ¥', min: 10000 },
        ].map(({ id, label, min }) => (
          <div key={id}>
            <Label htmlFor={id} className="text-xs">{label}</Label>
            <Input id={id} type="number" min={min} className="mt-1 h-8 text-sm"
              value={(form as any)[id]}
              onChange={(e) => setField(id, Number(e.target.value))}
              required
            />
          </div>
        ))}
      </div>

      <div>
        <Label className="text-xs">Prefectures served</Label>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {PREFS.map((p) => (
            <button key={p} type="button" onClick={() => togglePref(p)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                selectedPrefs.includes(p)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-primary/50'
              }`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full h-8 text-sm" loading={loading}>
        Add partner
      </Button>
    </form>
  );
}
