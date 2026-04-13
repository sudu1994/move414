import { calculateMoveCost, formatYen, isPeakSeason, calculateDistance } from '@/lib/utils';

// ─── formatYen ────────────────────────────────────────────

describe('formatYen', () => {
  it('formats zero', () => expect(formatYen(0)).toBe('¥0'));
  it('formats thousands', () => expect(formatYen(1980)).toBe('¥1,980'));
  it('formats large amounts', () => expect(formatYen(120000)).toBe('¥120,000'));
});

// ─── isPeakSeason ─────────────────────────────────────────

describe('isPeakSeason', () => {
  it('February is peak', () => expect(isPeakSeason(new Date('2026-02-15'))).toBe(true));
  it('March is peak', ()    => expect(isPeakSeason(new Date('2026-03-01'))).toBe(true));
  it('April 1 is peak', ()  => expect(isPeakSeason(new Date('2026-04-01'))).toBe(true));
  it('April 15 is peak', () => expect(isPeakSeason(new Date('2026-04-15'))).toBe(true));
  it('April 16 is not peak', () => expect(isPeakSeason(new Date('2026-04-16'))).toBe(false));
  it('January is not peak', () => expect(isPeakSeason(new Date('2026-01-15'))).toBe(false));
  it('June is not peak', ()    => expect(isPeakSeason(new Date('2026-06-01'))).toBe(false));
});

// ─── calculateMoveCost ────────────────────────────────────

describe('calculateMoveCost', () => {
  const baseParams = {
    planType: 'STANDARD' as const,
    distanceKm: 15,
    moveDate: new Date('2026-06-15'), // off-peak
    roomSize: '1LDK',
  };

  it('no surcharge within limit off-peak', () => {
    const result = calculateMoveCost(baseParams);
    expect(result.distanceSurcharge).toBe(0);
    expect(result.peakSurcharge).toBe(0);
    expect(result.customerPays).toBe(0);
  });

  it('peak surcharge applies in March', () => {
    const result = calculateMoveCost({ ...baseParams, moveDate: new Date('2026-03-15') });
    expect(result.peakSurcharge).toBeGreaterThan(0);
  });

  it('distance surcharge applies over limit', () => {
    const result = calculateMoveCost({ ...baseParams, distanceKm: 30 }); // Standard limit is 20km
    expect(result.distanceSurcharge).toBeGreaterThan(0);
  });

  it('LITE plan charges distance over 10km', () => {
    const result = calculateMoveCost({ ...baseParams, planType: 'LITE', distanceKm: 15 });
    expect(result.distanceSurcharge).toBeGreaterThan(0);
  });

  it('PLUS plan no charge at 25km', () => {
    const result = calculateMoveCost({ ...baseParams, planType: 'PLUS', distanceKm: 25 });
    expect(result.distanceSurcharge).toBe(0);
  });

  it('total = base + distance + peak', () => {
    const result = calculateMoveCost({ ...baseParams, distanceKm: 30, moveDate: new Date('2026-03-01') });
    expect(result.totalCost).toBe(result.baseCost + result.distanceSurcharge + result.peakSurcharge);
  });
});

// ─── calculateDistance ────────────────────────────────────

describe('calculateDistance', () => {
  it('same point = 0', () => {
    expect(calculateDistance(35.68, 139.69, 35.68, 139.69)).toBe(0);
  });

  it('Tokyo to Yokohama ~30km', () => {
    const d = calculateDistance(35.6894, 139.6917, 35.4437, 139.6380);
    expect(d).toBeGreaterThan(25);
    expect(d).toBeLessThan(35);
  });
});
