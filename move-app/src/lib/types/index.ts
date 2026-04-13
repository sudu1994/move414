// ─── MOVE App — Core Types ─────────────────────────────────

export type PlanType = 'LITE' | 'STANDARD' | 'PLUS' | 'BUSINESS';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'TRIALING' | 'PAUSED';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type UtilityType = 'GAS' | 'ELECTRICITY' | 'WATER' | 'INTERNET' | 'ALL';
export type UtilityStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
export type UserRole = 'CUSTOMER' | 'ADMIN' | 'PARTNER' | 'GIG_WORKER';
export type Language = 'JA' | 'EN' | 'ZH' | 'VI' | 'KO';

// ─── Plan Config ──────────────────────────────────────────

export interface PlanConfig {
  id: PlanType;
  nameEn: string;
  nameJa: string;
  monthlyPrice: number;
  maxDistanceKm: number;
  movesPerContract: number;
  contractMonths: number;
  features: string[];
  featuresJa: string[];
  stripeEnvKey: string;
  recommended?: boolean;
}

export const PLANS: Record<PlanType, PlanConfig> = {
  LITE: {
    id: 'LITE',
    nameEn: 'Lite',
    nameJa: 'ライト',
    monthlyPrice: 1980,
    maxDistanceKm: 10,
    movesPerContract: 1,
    contractMonths: 24,
    stripeEnvKey: 'STRIPE_PRICE_LITE',
    features: ['1 move per 2 years', 'Up to 10km', 'Utilities setup', 'Email support'],
    featuresJa: ['2年に1回の引越し', '10km以内', '光熱費手続き代行', 'メールサポート'],
  },
  STANDARD: {
    id: 'STANDARD',
    nameEn: 'Standard',
    nameJa: 'スタンダード',
    monthlyPrice: 3200,
    maxDistanceKm: 20,
    movesPerContract: 1,
    contractMonths: 24,
    stripeEnvKey: 'STRIPE_PRICE_STANDARD',
    recommended: true,
    features: ['1 move per 2 years', 'Up to 20km', 'Utilities setup', 'AI room design', 'Chat support'],
    featuresJa: ['2年に1回の引越し', '20km以内', '光熱費手続き代行', 'AI部屋コーディネート', 'チャットサポート'],
  },
  PLUS: {
    id: 'PLUS',
    nameEn: 'Plus',
    nameJa: 'プラス',
    monthlyPrice: 4800,
    maxDistanceKm: 30,
    movesPerContract: 1,
    contractMonths: 24,
    stripeEnvKey: 'STRIPE_PRICE_PLUS',
    features: ['1 move per 2 years', 'Up to 30km', 'Utilities setup', 'AI room design', 'Priority booking', 'Recycle pickup', 'Priority support'],
    featuresJa: ['2年に1回の引越し', '30km以内', '光熱費手続き代行', 'AI部屋コーディネート', '優先予約', 'リサイクル引取', '優先サポート'],
  },
  BUSINESS: {
    id: 'BUSINESS',
    nameEn: 'Business',
    nameJa: 'ビジネス',
    monthlyPrice: 8000,
    maxDistanceKm: 9999,
    movesPerContract: 999,
    contractMonths: 12,
    stripeEnvKey: 'STRIPE_PRICE_BUSINESS',
    features: ['Unlimited moves', 'Any distance', 'Multi-staff management', 'API access', 'HR portal', 'Dedicated support'],
    featuresJa: ['無制限の引越し', '距離制限なし', '複数名管理', 'API連携', 'HRポータル', '専任サポート'],
  },
};

// ─── Room sizes ───────────────────────────────────────────

export const ROOM_SIZES = [
  { value: '1R', labelEn: 'Studio (1R)', labelJa: 'ワンルーム (1R)' },
  { value: '1K', labelEn: '1K', labelJa: '1K' },
  { value: '1DK', labelEn: '1DK', labelJa: '1DK' },
  { value: '1LDK', labelEn: '1LDK', labelJa: '1LDK' },
  { value: '2K', labelEn: '2K', labelJa: '2K' },
  { value: '2DK', labelEn: '2DK', labelJa: '2DK' },
  { value: '2LDK', labelEn: '2LDK', labelJa: '2LDK' },
  { value: '3LDK', labelEn: '3LDK+', labelJa: '3LDK以上' },
] as const;

export const PREFECTURES = [
  'Tokyo', 'Kanagawa', 'Osaka', 'Aichi', 'Saitama', 'Chiba',
  'Hyogo', 'Fukuoka', 'Hokkaido', 'Kyoto', 'Other',
] as const;

// ─── API Response types ───────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─── Form types ───────────────────────────────────────────

export interface BookingFormData {
  fromAddress: string;
  fromPrefecture: string;
  fromCity: string;
  fromPostal: string;
  toAddress: string;
  toPrefecture: string;
  toCity: string;
  toPostal: string;
  roomSize: string;
  moveDate: string;
  moveTimeSlot: 'morning' | 'afternoon' | 'evening';
  floorFrom?: number;
  floorTo?: number;
  hasElevatorFrom: boolean;
  hasElevatorTo: boolean;
  specialItems: string[];
  notes?: string;
}

export interface UtilityFormData {
  address: string;
  prefecture: string;
  city: string;
  postalCode: string;
  moveInDate: string;
  services: UtilityType[];
  gasProvider?: string;
  elecProvider?: string;
  internetType?: string;
  preferredContact: 'email' | 'phone' | 'sms';
  language: Language;
  notes?: string;
}

export interface AiDesignFormData {
  roomType: string;
  roomSizeM2?: number;
  photos: File[];
  stylePreferences: string;
  budget?: string;
  language: Language;
}

// ─── Dashboard stats ──────────────────────────────────────

export interface DashboardStats {
  totalSubscribers: number;
  mrr: number;
  activeBookings: number;
  pendingUtilities: number;
  revenueThisMonth: number;
  churnRate: number;
  avgClaimRate: number;
  topPlan: PlanType;
}
