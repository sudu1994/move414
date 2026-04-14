import Link from 'next/link';
import { ArrowRight, Check, Zap, Home, Wrench, Sparkles, RefreshCcw } from 'lucide-react';
import { PLANS } from '@/lib/types';
import { formatYen } from '@/lib/utils';
'use client';

import { useEffect, useState } from 'react';
export default function HomePage() {
  const plans = Object.values(PLANS);

  return (
    <main className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight text-primary">MOVE</span>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 max-w-4xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full mb-6">
          <Zap size={12} />
          Japan&apos;s first relocation subscription
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
          Moving in Japan,<br />
          <span className="text-primary">made simple.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Pay monthly. Move when you need to. We handle everything — the move,
          your utilities setup, and even your room design.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/auth/signup"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Start your subscription <ArrowRight size={16} />
          </Link>
          <Link
            href="#plans"
            className="flex items-center gap-2 border px-6 py-3 rounded-lg font-medium hover:bg-muted transition-colors"
          >
            See plans
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 pt-12 border-t w-full">
          {[
            { value: '3.77M', label: 'Foreign residents in Japan', sub: '+10.5% YoY' },
            { value: '¥68K', label: 'Avg. move cost without MOVE', sub: '繁忙期は2倍以上' },
            { value: '0', label: 'English utilities services', sub: 'Blue ocean market' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              <p className="text-xs text-primary/60 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Everything in one subscription</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            No more calling 5 different companies. We handle the whole relocation in one place.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Home size={24} />,
                title: 'Moving service',
                titleJa: '引越しサービス',
                desc: '1 move every 2 years, covered. Distance and volume caps apply per plan.',
              },
              {
                icon: <Wrench size={24} />,
                title: 'Utilities setup',
                titleJa: '光熱費手続き',
                desc: 'Gas, electricity, water, internet — we make the calls in Japanese for you.',
              },
              {
                icon: <Sparkles size={24} />,
                title: 'AI room design',
                titleJa: 'AI内装提案',
                desc: 'Upload photos of your new room. Get a layout plan and furniture suggestions.',
              },
              {
                icon: <RefreshCcw size={24} />,
                title: 'Recycle network',
                titleJa: 'リサイクル連携',
                desc: 'Sell or donate unwanted items at move-out. We connect you to Hard Off & Eco Ring.',
              },
            ].map((f) => (
              <div key={f.title} className="bg-background rounded-xl border p-6">
                <div className="text-primary mb-4">{f.icon}</div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-xs text-primary/60 mb-2">{f.titleJa}</p>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Simple, predictable pricing</h2>
          <p className="text-muted-foreground text-center mb-12">
            Lock in your rate for 2 years. No surprise bills at moving time.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-xl border p-6 flex flex-col ${
                  plan.recommended ? 'border-primary ring-2 ring-primary/20 relative' : ''
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Most popular
                  </div>
                )}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-1">{plan.nameJa}</p>
                  <h3 className="text-lg font-bold">{plan.nameEn}</h3>
                  <div className="mt-3">
                    <span className="text-3xl font-bold">{formatYen(plan.monthlyPrice)}</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                </div>
                <ul className="flex-1 space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check size={14} className="text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/auth/signup?plan=${plan.id.toLowerCase()}`}
                  className={`text-center py-2 rounded-lg text-sm font-medium transition-colors ${
                    plan.recommended
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border hover:bg-muted'
                  }`}
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Peak season surcharge (Feb–Apr): +¥10,000–20,000 · Distance and volume overages billed separately
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p className="font-bold text-foreground">MOVE</p>
          <p>© 2026 MOVE. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
