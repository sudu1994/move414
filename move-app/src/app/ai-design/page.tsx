'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { Upload, Sparkles, X, Loader2, Scan, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label, Textarea, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/form-elements';
import { toast } from '@/components/ui/toaster';

const ROOM_TYPES = [
  { value: 'bedroom',  label: 'Bedroom 寝室' },
  { value: 'living',   label: 'Living room リビング' },
  { value: 'kitchen',  label: 'Kitchen / Dining キッチン' },
  { value: 'studio',   label: 'Studio ワンルーム全体' },
  { value: 'office',   label: 'Home office 書斎' },
  { value: 'kids',     label: 'Kids room 子供部屋' },
];

interface DesignResult {
  summary: string;
  layout: string;
  furniture: Array<{ item: string; description: string; whereToBuy: string; estimatedPrice: string }>;
  colorScheme: string;
  tips: string[];
}

export default function AiDesignPage() {
  const [photos, setPhotos]     = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [roomType, setRoomType] = useState('');
  const [prompt, setPrompt]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<DesignResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 3 - photos.length);
    setPhotos((p) => [...p, ...newFiles]);
    newFiles.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((p) => [...p, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  }

  function removePhoto(idx: number) {
    setPhotos((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomType) { toast({ title: 'Select a room type', variant: 'destructive' }); return; }
    setLoading(true);
    setResult(null);
    try {
      const photoData = previews.map((p) => ({ data: p.split(',')[1], mediaType: 'image/jpeg' }));
      const res = await fetch('/api/ai-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomType, prompt, photos: photoData }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResult(json.data);
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'AI failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">AI room design</h1>
        <p className="text-muted-foreground text-sm mt-0.5">AI部屋コーディネート</p>
      </div>

      {/* Scanner CTA */}
      <Link href="/room-scanner"
        className="flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4 mb-6 hover:bg-primary/10 transition-colors group">
        <div className="p-3 bg-primary/10 rounded-xl shrink-0">
          <Scan size={22} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-primary">Use LiDAR Room Scanner first</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Scan your room to capture exact dimensions, then get AI recommendations that actually fit.
            <span className="text-primary/70"> 3Dスキャンで正確な家具サイズを計測。</span>
          </p>
        </div>
        <ChevronRight size={16} className="text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
      </Link>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label className="text-base font-semibold">Room photos (up to 3)</Label>
          <p className="text-xs text-muted-foreground mb-3">部屋の写真をアップロード</p>
          {previews.length > 0 && (
            <div className="flex gap-3 mb-3 flex-wrap">
              {previews.map((src, i) => (
                <div key={i} className="relative group w-28 h-28 rounded-xl overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {photos.length < 3 && (
            <button type="button" onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              className="w-full border-2 border-dashed border-border rounded-xl py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors">
              <Upload size={24} />
              <p className="text-sm">Click or drag photos here</p>
              <p className="text-xs">{3 - photos.length} remaining</p>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => handleFiles(e.target.files)} />
        </div>

        <div>
          <Label>Room type 部屋の種類</Label>
          <Select onValueChange={setRoomType}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select room type..." /></SelectTrigger>
            <SelectContent>
              {ROOM_TYPES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="prompt">Style preferences (optional)</Label>
          <Textarea id="prompt"
            placeholder="e.g. Minimalist Japanese, warm tones, budget ¥50,000, I work from home..."
            className="mt-1" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>

        <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!roomType}>
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Analyzing…</>
            : <><Sparkles size={16} /> Generate design plan</>}
        </Button>
      </form>

      {result && (
        <div className="mt-8 space-y-5 animate-fade-in">
          <div className="border-t pt-6">
            <h2 className="text-xl font-bold">Your design plan</h2>
            <p className="text-xs text-muted-foreground mt-0.5">AI generated · Claude Vision</p>
          </div>
          {[
            { title: 'Overview',              content: result.summary },
            { title: 'Layout recommendation', content: result.layout },
            { title: 'Color scheme',          content: result.colorScheme },
          ].map(({ title, content }) => content && (
            <div key={title} className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
            </div>
          ))}
          {result.furniture?.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold mb-3">Furniture suggestions</h3>
              <div className="space-y-3">
                {result.furniture.map((f, i) => (
                  <div key={i} className="border rounded-lg p-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{f.item}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                      <p className="text-xs text-primary mt-1">{f.whereToBuy}</p>
                    </div>
                    <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full shrink-0">
                      {f.estimatedPrice}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.tips?.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold mb-3">Tips</h3>
              <ul className="space-y-2">
                {result.tips.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary font-bold mt-0.5">{i + 1}.</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
