import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from '@/components/ui/toaster';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

import '@/styles/globals.css';

export const metadata: Metadata = {
  title: { default: 'MOVE — Japan Relocation Subscription', template: '%s | MOVE' },
  description: 'Monthly subscription for moving, utilities setup, and AI room design in Japan.',
  keywords: ['moving Japan', '引越し', 'subscription', 'expat Japan', 'utilities setup'],
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="ja" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="min-h-screen bg-background antialiased">
          <LanguageSwitcher />
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}