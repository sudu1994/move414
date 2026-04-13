'use client';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/form-elements';
import { toast } from '@/components/ui/toaster';
import { User, Bell, CreditCard, Globe } from 'lucide-react';

const LANGUAGES = [
  { value: 'EN', label: 'English' },
  { value: 'JA', label: '日本語' },
  { value: 'ZH', label: '中文' },
  { value: 'VI', label: 'Tiếng Việt' },
  { value: 'KO', label: '한국어' },
];

export default function SettingsPage() {
  const { user } = useUser();
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('EN');

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, language }),
      });
      toast({ title: 'Settings saved', variant: 'success' });
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  const sections = [
    { id: 'profile', icon: User,       label: 'Profile' },
    { id: 'language', icon: Globe,     label: 'Language' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'billing', icon: CreditCard, label: 'Billing' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your account preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-primary" />
            <h2 className="font-semibold">Profile</h2>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First name</Label>
                <Input className="mt-1" defaultValue={user?.firstName ?? ''} disabled />
              </div>
              <div>
                <Label>Last name</Label>
                <Input className="mt-1" defaultValue={user?.lastName ?? ''} disabled />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-1" defaultValue={user?.primaryEmailAddress?.emailAddress ?? ''} disabled />
              <p className="text-xs text-muted-foreground mt-1">Managed by your account — change in Clerk profile.</p>
            </div>
            <div>
              <Label htmlFor="phone">Phone number (for SMS updates)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+81 90-xxxx-xxxx"
                className="mt-1"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={16} className="text-primary" />
            <h2 className="font-semibold">Language preference</h2>
          </div>
          <div>
            <Label>Preferred language for notifications and support</Label>
            <Select defaultValue="EN" onValueChange={setLanguage}>
              <SelectTrigger className="mt-1 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Billing */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={16} className="text-primary" />
            <h2 className="font-semibold">Billing</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Manage your subscription, payment methods, and invoices.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              const res = await fetch('/api/subscriptions/portal', { method: 'POST' });
              const { url } = await res.json();
              if (url) window.location.href = url;
            }}
          >
            Open billing portal
          </Button>
        </div>

        <Button type="submit" loading={saving}>Save changes</Button>
      </form>
    </div>
  );
}
