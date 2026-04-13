import { addMonths, isWithinInterval, parseISO, format } from 'date-fns';
import type { PlanType } from '@/lib/types';
import { PLANS } from '@/lib/types';

// ─── Formatting ───────────────────────────────────────────

export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}

export function formatDate(date: Date | string, lang: 'en' | 'ja' = 'en'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, lang === 'ja' ? 'yyyy年M月d日' : 'MMM d, yyyy');
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy HH:mm');
}

// ─── Subscription logic ───────────────────────────────────

export function calculateContractEndDate(startDate: Date, planType: PlanType): Date {
  const months = PLANS[planType].contractMonths;
  return addMonths(startDate, months);
}

export function calculateNextMoveDate(startDate: Date): Date {
  return addMonths(startDate, 24);
}

export function isEligibleForMove(
  lastMoveDate: Date | null,
  contractStartDate: Date,
): boolean {
  if (!lastMoveDate) return true;
  const nextEligible = addMonths(lastMoveDate, 24);
  return new Date() >= nextEligible;
}

// ─── Pricing ─────────────────────────────────────────────

export interface PricingBreakdown {
  baseCost: number;
  distanceSurcharge: number;
  peakSurcharge: number;
  totalCost: number;
  coveredByPlan: number;
  customerPays: number;
}

export function calculateMoveCost(params: {
  planType: PlanType;
  distanceKm: number;
  moveDate: Date;
  roomSize: string;
  partnerRate?: number;
}): PricingBreakdown {
  const { planType, distanceKm, moveDate, roomSize, partnerRate = 45000 } = params;
  const plan = PLANS[planType];

  // Base cost by room size
  const roomBaseCost: Record<string, number> = {
    '1R': 35000, '1K': 38000, '1DK': 42000,
    '1LDK': 50000, '2K': 52000, '2DK': 55000,
    '2LDK': 65000, '3LDK': 80000,
  };
  const baseCost = roomBaseCost[roomSize] ?? partnerRate;

  // Distance surcharge
  let distanceSurcharge = 0;
  if (distanceKm > plan.maxDistanceKm) {
    const excessKm = distanceKm - plan.maxDistanceKm;
    distanceSurcharge = Math.ceil(excessKm / 5) * 3000; // ¥3,000 per 5km over limit
  }

  // Peak season check (Feb 1 – Apr 15)
  const month = moveDate.getMonth() + 1;
  const day = moveDate.getDate();
  const isPeak =
    (month === 2) ||
    (month === 3) ||
    (month === 4 && day <= 15);
  const peakSurcharge = isPeak ? plan.peakSurcharge : 0;

  const totalCost = baseCost + distanceSurcharge + peakSurcharge;

  // Plan covers base if within limits
  const coveredByPlan = distanceSurcharge === 0 ? baseCost : 0;
  const customerPays = totalCost - coveredByPlan;

  return {
    baseCost,
    distanceSurcharge,
    peakSurcharge,
    totalCost,
    coveredByPlan,
    customerPays: Math.max(0, customerPays),
  };
}

// ─── Distance (Haversine formula) ─────────────────────────

export function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// ─── SMS helpers ──────────────────────────────────────────

export function buildBookingConfirmationSMS(params: {
  name: string;
  moveDate: string;
  fromAddress: string;
  toAddress: string;
  lang: 'en' | 'ja';
}): string {
  const { name, moveDate, fromAddress, toAddress, lang } = params;
  if (lang === 'ja') {
    return `【MOVE】${name}様の引越し予約が確定しました。\n引越し日：${moveDate}\n出発：${fromAddress}\n到着：${toAddress}\nご不明点はアプリからご連絡ください。`;
  }
  return `[MOVE] Hi ${name}! Your move is confirmed.\nDate: ${moveDate}\nFrom: ${fromAddress}\nTo: ${toAddress}\nContact us in the app for any questions.`;
}

// ─── Misc ─────────────────────────────────────────────────

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function isPeakSeason(date: Date): boolean {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return m === 2 || m === 3 || (m === 4 && d <= 15);
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}
