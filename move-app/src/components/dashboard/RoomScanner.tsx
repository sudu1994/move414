'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Scan, Camera, RotateCcw, Move, Maximize2,
  CheckCircle2, AlertCircle, ChevronRight, X, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────

interface ScannedItem {
  id: string;
  name: string;
  width: number;   // cm
  depth: number;
  height: number;
  confidence: number;
  color: string;
  x: number;       // grid position (0-9)
  y: number;
}

interface ScanPoint {
  x: number;
  y: number;
  opacity: number;
  size: number;
}

type ScanPhase = 'idle' | 'scanning' | 'complete' | 'placing';

// ─── Constants ────────────────────────────────────────────

const FURNITURE_PRESETS: Omit<ScannedItem, 'id' | 'x' | 'y'>[] = [
  { name: 'Sofa',        width: 200, depth: 85,  height: 80,  confidence: 97, color: '#6366f1' },
  { name: 'Dining table',width: 120, depth: 80,  height: 74,  confidence: 94, color: '#f59e0b' },
  { name: 'Bed (single)',width: 97,  depth: 195, height: 55,  confidence: 98, color: '#10b981' },
  { name: 'Bookshelf',   width: 80,  depth: 30,  height: 180, confidence: 91, color: '#8b5cf6' },
  { name: 'TV stand',    width: 140, depth: 40,  height: 50,  confidence: 95, color: '#ec4899' },
  { name: 'Desk',        width: 120, depth: 60,  height: 72,  confidence: 96, color: '#06b6d4' },
  { name: 'Wardrobe',    width: 90,  depth: 55,  height: 200, confidence: 93, color: '#f97316' },
  { name: 'Coffee table',width: 90,  depth: 50,  height: 40,  confidence: 92, color: '#84cc16' },
];

const ROOM_COLS = 10;
const ROOM_ROWS = 8;

// ─── Helpers ─────────────────────────────────────────────

function randomBetween(a: number, b: number) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function generatePoints(count: number, centerX: number, centerY: number, radius: number): ScanPoint[] {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    return {
      x: centerX + Math.cos(angle) * r,
      y: centerY + Math.sin(angle) * r,
      opacity: 0.4 + Math.random() * 0.6,
      size: 1 + Math.random() * 3,
    };
  });
}

// ─── Room Grid ────────────────────────────────────────────

function RoomGrid({
  items,
  dragging,
  onCellClick,
  onItemClick,
}: {
  items: ScannedItem[];
  dragging: ScannedItem | null;
  onCellClick: (x: number, y: number) => void;
  onItemClick: (item: ScannedItem) => void;
}) {
  // Map items to grid cells (each item is 1x1 for simplicity at this scale)
  const occupied = new Map(items.map((i) => [`${i.x},${i.y}`, i]));

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Room layout — 5m × 4m</h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-3 h-3 rounded-sm bg-primary/20 border border-primary/40" />
          Placed items
        </div>
      </div>
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${ROOM_COLS}, 1fr)` }}
      >
        {Array.from({ length: ROOM_ROWS * ROOM_COLS }, (_, idx) => {
          const x = idx % ROOM_COLS;
          const y = Math.floor(idx / ROOM_COLS);
          const item = occupied.get(`${x},${y}`);
          const isDragTarget = dragging !== null;

          return (
            <div
              key={idx}
              onClick={() => isDragTarget && onCellClick(x, y)}
              className={cn(
                'aspect-square rounded-sm border transition-all text-[8px] flex items-center justify-center overflow-hidden',
                item
                  ? 'border-transparent cursor-pointer'
                  : isDragTarget
                  ? 'border-dashed border-primary/50 bg-primary/5 cursor-crosshair hover:bg-primary/15'
                  : 'border-border/40 bg-muted/20'
              )}
              style={item ? { backgroundColor: item.color + '33', borderColor: item.color + '66' } : undefined}
              title={item ? `${item.name} (${item.width}×${item.depth}cm)` : undefined}
            >
              {item && (
                <span
                  className="font-bold truncate px-0.5 cursor-pointer"
                  style={{ color: item.color }}
                  onClick={(e) => { e.stopPropagation(); onItemClick(item); }}
                >
                  {item.name.slice(0, 2)}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Each cell = 50×50 cm · Click a cell to place the selected item
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────

export function RoomScanner() {
  const [phase, setPhase]           = useState<ScanPhase>('idle');
  const [progress, setProgress]     = useState(0);
  const [points, setPoints]         = useState<ScanPoint[]>([]);
  const [scannedItems, setScanned]  = useState<ScannedItem[]>([]);
  const [placedItems, setPlaced]    = useState<ScannedItem[]>([]);
  const [dragging, setDragging]     = useState<ScannedItem | null>(null);
  const [selected, setSelected]     = useState<ScannedItem | null>(null);
  const [scanAngle, setScanAngle]   = useState(0);
  const [captureIndex, setCaptureIndex] = useState(0);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const animRef     = useRef<number>(0);
  const phaseRef    = useRef(phase);
  phaseRef.current = phase;

  // Radar sweep animation on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    function draw() {
      if (!ctx || !canvas) return;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(cx, cy) - 8;

      ctx.clearRect(0, 0, W, H);

      // Background rings
      ctx.strokeStyle = 'rgba(99,102,241,0.15)';
      ctx.lineWidth = 1;
      for (let r = R / 4; r <= R; r += R / 4) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Crosshair
      ctx.strokeStyle = 'rgba(99,102,241,0.2)';
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();

      if (phaseRef.current === 'scanning') {
        // Sweep gradient
        const sweep = ctx.createConicGradient
          ? ctx.createConicGradient(angle - 1.2, cx, cy)
             : null;

        // Fallback arc sweep
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        const grad = ctx.createLinearGradient(0, 0, R, 0);
        grad.addColorStop(0, 'rgba(99,102,241,0.6)');
        grad.addColorStop(1, 'rgba(99,102,241,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, R, -0.6, 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Sweep line
        ctx.strokeStyle = 'rgba(99,102,241,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R);
        ctx.stroke();

        angle += 0.04;
        setScanAngle(angle);
      }

      // Scan points
      points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(cx + p.x, cy + p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${p.opacity})`;
        ctx.fill();
      });

      // Outer ring
      ctx.strokeStyle =
        phaseRef.current === 'scanning' ? 'rgba(99,102,241,0.6)'
        : phaseRef.current === 'complete' ? 'rgba(16,185,129,0.6)'
        : 'rgba(99,102,241,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [points]);

  // Scan progress simulation
  useEffect(() => {
    if (phase !== 'scanning') return;

    let prog = 0;
    const interval = setInterval(() => {
      prog += randomBetween(2, 5);
      setProgress(Math.min(prog, 100));

      // Add random scan points
      setPoints((prev) => {
        const next = [...prev, ...generatePoints(8, 0, 0, 90)].slice(-300);
        return next;
      });

      if (prog >= 100) {
        clearInterval(interval);
        setPhase('complete');

        // Pick random furniture items as "detected"
        const detected = FURNITURE_PRESETS
          .sort(() => Math.random() - 0.5)
          .slice(0, randomBetween(3, 6))
          .map((preset, i) => ({
            ...preset,
            id: `item-${Date.now()}-${i}`,
            x: randomBetween(0, 8),
            y: randomBetween(0, 6),
          }));
        setScanned(detected);
      }
    }, 120);

    return () => clearInterval(interval);
  }, [phase]);

  function startScan() {
    setPhase('scanning');
    setProgress(0);
    setPoints([]);
    setScanned([]);
    setPlaced([]);
    setDragging(null);
    setSelected(null);
    setCaptureIndex(0);
  }

  function captureNext() {
    if (captureIndex < scannedItems.length) {
      setCaptureIndex((i) => i + 1);
    }
  }

  function startPlacing(item: ScannedItem) {
    setDragging(item);
    setPhase('placing');
  }

  function placeItem(x: number, y: number) {
    if (!dragging) return;
    setPlaced((prev) => {
      const filtered = prev.filter((i) => i.id !== dragging.id);
      return [...filtered, { ...dragging, x, y }];
    });
    setDragging(null);
    setPhase('complete');
  }

  function removeFromLayout(item: ScannedItem) {
    setPlaced((prev) => prev.filter((i) => i.id !== item.id));
    setSelected(null);
  }

  const revealedItems = scannedItems.slice(0, captureIndex);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Scan size={20} className="text-primary" />
            LiDAR Room Scanner
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Scan your room to capture furniture dimensions and plan your layout.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
         <div className={cn(
  'w-1.5 h-1.5 rounded-full',
  phase === 'idle' && 'bg-muted-foreground',
  phase === 'scanning' && 'bg-yellow-500 animate-pulse',
  (phase === 'complete' || phase === 'placing') && 'bg-green-500'
)} />
          {phase === 'idle' && 'Ready'}
          {phase === 'scanning' && 'Scanning…'}
          {phase === 'complete' && 'Scan complete'}
          {phase === 'placing' && 'Placing item…'}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Scanner viewfinder */}
        <div className="space-y-3">
          <div className="rounded-xl border bg-card p-4">
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ paddingBottom: '100%' }}>
              <canvas
                ref={canvasRef}
                width={280}
                height={280}
                className="absolute inset-0 w-full h-full"
              />
              {/* Corner overlays */}
              {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos, i) => (
                <div
                  key={i}
                  className={cn('absolute w-5 h-5', pos,
                    i < 2 ? 'border-t-2' : 'border-b-2',
                    i % 2 === 0 ? 'border-l-2' : 'border-r-2',
                    phase === 'scanning' ? 'border-primary' : 'border-primary/40'
                  )}
                />
              ))}

              {/* Status overlay */}
              {phase === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-primary/60">
                    <Scan size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Point at your room</p>
                  </div>
                </div>
              )}
              {phase === 'complete' && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 bg-green-900/80 text-green-300 text-xs px-3 py-1.5 rounded-full">
                    <CheckCircle2 size={12} />
                    {scannedItems.length} items detected
                  </div>
                </div>
              )}
              {phase === 'placing' && dragging && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 bg-primary/80 text-white text-xs px-3 py-1.5 rounded-full">
                    <Move size={12} />
                    Placing: {dragging.name}
                  </div>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {phase === 'scanning' && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Scanning environment…</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-1 mt-2 text-[10px] text-muted-foreground">
                  {['Depth mapping', 'Edge detection', 'Object recognition'].map((s, i) => (
                    <div key={s} className={cn('flex items-center gap-1', progress > (i + 1) * 30 ? 'text-primary' : '')}>
                      <div className={cn('w-1.5 h-1.5 rounded-full', progress > (i + 1) * 30 ? 'bg-primary' : 'bg-muted-foreground/40')} />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Scan controls */}
          <div className="flex gap-2">
            <Button
              onClick={startScan}
              disabled={phase === 'scanning'}
              className="flex-1"
              variant={phase === 'idle' ? 'default' : 'outline'}
            >
              {phase === 'scanning' ? (
                <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Scanning</>
              ) : (
                <><Camera size={15} /> {phase === 'idle' ? 'Start scan' : 'Rescan'}</>
              )}
            </Button>
            {phase !== 'idle' && (
              <Button variant="outline" size="icon" onClick={() => { setPhase('idle'); setPoints([]); setProgress(0); }}>
                <RotateCcw size={15} />
              </Button>
            )}
          </div>
        </div>

        {/* Detected items panel */}
        <div className="space-y-3">
          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Detected items</h3>
              {phase === 'complete' && captureIndex < scannedItems.length && (
                <span className="text-xs text-muted-foreground">
                  {scannedItems.length - captureIndex} pending
                </span>
              )}
            </div>

            {phase === 'idle' && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">No scan data yet</p>
              </div>
            )}

            {phase === 'scanning' && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            )}

            {(phase === 'complete' || phase === 'placing') && (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {revealedItems.map((item) => {
                  const isPlaced = placedItems.some((p) => p.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center gap-3 p-2.5 rounded-lg border transition-colors',
                        isPlaced ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-border bg-muted/30',
                        selected?.id === item.id && 'ring-2 ring-primary'
                      )}
                    >
                      <div
                        className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.name.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.width}W × {item.depth}D × {item.height}H cm · {item.confidence}% conf.
                        </p>
                      </div>
                      {isPlaced ? (
                        <span className="text-xs text-green-600 font-medium shrink-0">Placed</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2 shrink-0"
                          onClick={() => startPlacing(item)}
                        >
                          <Move size={11} /> Place
                        </Button>
                      )}
                    </div>
                  );
                })}

                {captureIndex < scannedItems.length && (
                  <button
                    onClick={captureNext}
                    className="w-full py-2.5 rounded-lg border-2 border-dashed border-primary/40 text-xs text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Camera size={13} />
                    Capture next item ({scannedItems.length - captureIndex} remaining)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Selected item detail */}
          {selected && (
            <div className="rounded-xl border bg-card p-4 animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">{selected.name}</h3>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[['W', selected.width], ['D', selected.depth], ['H', selected.height]].map(([dim, val]) => (
                  <div key={dim} className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-muted-foreground">{dim}</p>
                    <p className="text-sm font-bold">{val}<span className="text-xs font-normal">cm</span></p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 text-xs" onClick={() => startPlacing(selected)}>
                  <Move size={12} /> Place in room
                </Button>
                {placedItems.some((p) => p.id === selected.id) && (
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => removeFromLayout(selected)}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Room layout grid */}
      {(phase === 'complete' || phase === 'placing') && (
        <div className="animate-fade-in">
          {phase === 'placing' && dragging && (
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-3 py-2 mb-3 text-sm text-primary">
              <Info size={14} />
              Click any empty cell to place <strong>{dragging.name}</strong>
              <button className="ml-auto" onClick={() => { setDragging(null); setPhase('complete'); }}>
                <X size={14} />
              </button>
            </div>
          )}
          <RoomGrid
            items={placedItems}
            dragging={dragging}
            onCellClick={placeItem}
            onItemClick={setSelected}
          />
          {placedItems.length > 0 && (
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{placedItems.length} item(s) placed · Click a placed item to select it</span>
              <button
                className="text-primary hover:underline flex items-center gap-1"
                onClick={() => setPlaced([])}
              >
                <RotateCcw size={11} /> Clear layout
              </button>
            </div>
          )}
        </div>
      )}

      {/* Export hint */}
      {placedItems.length >= 2 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3 animate-fade-in">
          <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary">Layout ready</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              You have {placedItems.length} items placed. Go to AI Design to get furniture recommendations that fit your scanned dimensions.
            </p>
          </div>
          <a
            href="/ai-design"
            className="ml-auto shrink-0 flex items-center gap-1 text-xs text-primary font-medium hover:underline"
          >
            AI Design <ChevronRight size={12} />
          </a>
        </div>
      )}
    </div>
  );
}
