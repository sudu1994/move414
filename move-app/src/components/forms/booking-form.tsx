'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Calendar, Home, ChevronRight, ChevronLeft, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Textarea } from '@/components/ui/form-elements';
import { toast } from '@/components/ui/toaster';
import { ROOM_SIZES, PREFECTURES } from '@/lib/types';
import { formatYen, isPeakSeason } from '@/lib/utils';
import { cn } from '@/lib/utils';

const bookingSchema = z.object({
  fromAddress: z.string().min(5, 'Enter full address'),
  fromPrefecture: z.string().min(1, 'Select prefecture'),
  fromCity: z.string().min(1, 'Enter city'),
  fromPostal: z.string().min(7, 'Enter valid postal code'),
  toAddress: z.string().min(5, 'Enter full address'),
  toPrefecture: z.string().min(1, 'Select prefecture'),
  toCity: z.string().min(1, 'Enter city'),
  toPostal: z.string().min(7, 'Enter valid postal code'),
  roomSize: z.string().min(1, 'Select room size'),
  moveDate: z.string().min(1, 'Select move date'),
  moveTimeSlot: z.enum(['morning', 'afternoon', 'evening']),
  floorFrom: z.coerce.number().optional(),
  floorTo: z.coerce.number().optional(),
  hasElevatorFrom: z.boolean().default(false),
  hasElevatorTo: z.boolean().default(false),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const STEPS = [
  { id: 1, label: 'From',    icon: MapPin },
  { id: 2, label: 'To',      icon: MapPin },
  { id: 3, label: 'Details', icon: Home },
  { id: 4, label: 'Date',    icon: Calendar },
  { id: 5, label: 'Confirm', icon: Check },
];

interface BookingFormProps {
  userId: string;
  planType?: string;
  maxDistanceKm?: number;
}

export function BookingForm({ userId, planType, maxDistanceKm = 20 }: BookingFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      moveTimeSlot: 'morning',
      hasElevatorFrom: false,
      hasElevatorTo: false,
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const values = watch();
  const moveDate = values.moveDate ? new Date(values.moveDate) : null;
  const isPeak = moveDate ? isPeakSeason(moveDate) : false;

  async function onSubmit(data: BookingFormValues) {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create booking');
      toast({ title: 'Booking submitted!', description: 'We will confirm within 24 hours.', variant: 'success' });
      router.push('/dashboard');
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Something went wrong', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function nextStep() {
    setStep((s) => Math.min(s + 1, STEPS.length));
  }
  function prevStep() {
    setStep((s) => Math.max(s - 1, 1));
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className={cn(
              'flex items-center gap-1.5',
              step > s.id ? 'text-primary' : step === s.id ? 'text-primary font-medium' : 'text-muted-foreground'
            )}>
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 transition-colors',
                step > s.id ? 'bg-primary border-primary text-primary-foreground' :
                step === s.id ? 'border-primary text-primary' : 'border-muted-foreground/30 text-muted-foreground'
              )}>
                {step > s.id ? <Check size={12} /> : s.id}
              </div>
              <span className="text-xs hidden sm:block">{s.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={cn('flex-1 h-px mx-2', step > s.id ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1 — From address */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold">Where are you moving FROM?</h2>
              <p className="text-sm text-muted-foreground mt-0.5">現在のご住所を入力してください</p>
            </div>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="fromPostal">Postal code 〒</Label>
                <Input id="fromPostal" placeholder="123-4567" className="mt-1" {...register('fromPostal')} />
                {errors.fromPostal && <p className="text-xs text-destructive mt-1">{errors.fromPostal.message}</p>}
              </div>
              <div>
                <Label>Prefecture 都道府県</Label>
                <Select onValueChange={(v) => setValue('fromPrefecture', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {PREFECTURES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.fromPrefecture && <p className="text-xs text-destructive mt-1">{errors.fromPrefecture.message}</p>}
              </div>
              <div>
                <Label htmlFor="fromCity">City / Town 市区町村</Label>
                <Input id="fromCity" placeholder="Shinjuku-ku" className="mt-1" {...register('fromCity')} />
              </div>
              <div>
                <Label htmlFor="fromAddress">Street address 番地</Label>
                <Input id="fromAddress" placeholder="1-2-3 Kabukicho" className="mt-1" {...register('fromAddress')} />
                {errors.fromAddress && <p className="text-xs text-destructive mt-1">{errors.fromAddress.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="floorFrom">Floor number (optional)</Label>
                  <Input id="floorFrom" type="number" placeholder="3" className="mt-1" {...register('floorFrom')} />
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" className="rounded" {...register('hasElevatorFrom')} />
                    Has elevator
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — To address */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold">Where are you moving TO?</h2>
              <p className="text-sm text-muted-foreground mt-0.5">新しいご住所を入力してください</p>
            </div>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="toPostal">Postal code 〒</Label>
                <Input id="toPostal" placeholder="123-4567" className="mt-1" {...register('toPostal')} />
              </div>
              <div>
                <Label>Prefecture 都道府県</Label>
                <Select onValueChange={(v) => setValue('toPrefecture', v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {PREFECTURES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="toCity">City / Town 市区町村</Label>
                <Input id="toCity" placeholder="Shibuya-ku" className="mt-1" {...register('toCity')} />
              </div>
              <div>
                <Label htmlFor="toAddress">Street address 番地</Label>
                <Input id="toAddress" placeholder="4-5-6 Daikanyama" className="mt-1" {...register('toAddress')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="floorTo">Floor number (optional)</Label>
                  <Input id="floorTo" type="number" placeholder="5" className="mt-1" {...register('floorTo')} />
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" className="rounded" {...register('hasElevatorTo')} />
                    Has elevator
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Room details */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold">Room details</h2>
              <p className="text-sm text-muted-foreground mt-0.5">お部屋の間取りを選んでください</p>
            </div>
            <div>
              <Label>Room size 間取り</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {ROOM_SIZES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setValue('roomSize', r.value)}
                    className={cn(
                      'py-3 rounded-lg border text-sm font-medium transition-colors',
                      values.roomSize === r.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50 hover:bg-muted'
                    )}
                  >
                    {r.value}
                  </button>
                ))}
              </div>
              {errors.roomSize && <p className="text-xs text-destructive mt-1">{errors.roomSize.message}</p>}
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional) 備考</Label>
              <Textarea
                id="notes"
                placeholder="Special items (piano, bike...), access instructions, etc."
                className="mt-1"
                {...register('notes')}
              />
            </div>
          </div>
        )}

        {/* Step 4 — Date & time */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold">When do you want to move?</h2>
              <p className="text-sm text-muted-foreground mt-0.5">引越し希望日を選んでください</p>
            </div>
            {isPeak && (
              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                <AlertTriangle size={14} className="text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-yellow-800">
                  <strong>Peak season surcharge applies.</strong> A ¥10,000–20,000 fee will be added for moves in Feb–Apr.
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="moveDate">Move date 引越し日</Label>
              <Input
                id="moveDate"
                type="date"
                min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className="mt-1"
                {...register('moveDate')}
              />
              {errors.moveDate && <p className="text-xs text-destructive mt-1">{errors.moveDate.message}</p>}
            </div>
            <div>
              <Label>Preferred time slot 時間帯</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { value: 'morning',   label: 'Morning',   sub: '8:00〜12:00' },
                  { value: 'afternoon', label: 'Afternoon', sub: '12:00〜17:00' },
                  { value: 'evening',   label: 'Evening',   sub: '17:00〜20:00' },
                ].map((slot) => (
                  <button
                    key={slot.value}
                    type="button"
                    onClick={() => setValue('moveTimeSlot', slot.value as 'morning' | 'afternoon' | 'evening')}
                    className={cn(
                      'py-3 px-2 rounded-lg border text-sm transition-colors',
                      values.moveTimeSlot === slot.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50 hover:bg-muted'
                    )}
                  >
                    <p className="font-medium">{slot.label}</p>
                    <p className="text-xs opacity-70">{slot.sub}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5 — Confirm */}
        {step === 5 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h2 className="text-lg font-semibold">Confirm your booking</h2>
              <p className="text-sm text-muted-foreground mt-0.5">内容をご確認ください</p>
            </div>
            <div className="rounded-xl border divide-y bg-card">
              {[
                { label: 'From', value: `${values.fromAddress}, ${values.fromCity}, ${values.fromPrefecture}` },
                { label: 'To',   value: `${values.toAddress}, ${values.toCity}, ${values.toPrefecture}` },
                { label: 'Room', value: values.roomSize },
                { label: 'Date', value: values.moveDate ? `${values.moveDate} (${values.moveTimeSlot})` : '—' },
                { label: 'Plan', value: planType ?? 'No plan' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-right max-w-xs">{value}</span>
                </div>
              ))}
              {isPeak && (
                <div className="flex justify-between px-4 py-3 text-sm bg-yellow-50">
                  <span className="text-yellow-700">Peak surcharge</span>
                  <span className="font-medium text-yellow-800">+¥10,000〜20,000</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              We will contact you within 24 hours to confirm partner availability and final pricing.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button type="button" variant="outline" onClick={prevStep} disabled={step === 1}>
            <ChevronLeft size={16} /> Back
          </Button>
          {step < STEPS.length ? (
            <Button type="button" onClick={nextStep}>
              Next <ChevronRight size={16} />
            </Button>
          ) : (
            <Button type="submit" loading={loading}>
              Submit booking <Check size={16} />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
