import type { Metadata } from 'next';
import { DM_Sans, DM_Mono } from 'next/font/google';
import { Providers } from './providers';
import '@/styles/globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' });
const dmMono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Morpho Public Allocator Viewer',
  description: 'View Public Allocator configuration for Morpho Vaults',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${dmSans.variable} ${dmMono.variable} font-sans text-gray-100 min-h-screen antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
