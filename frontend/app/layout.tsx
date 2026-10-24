import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Doyle Roofing & Remodeling — Houston, TX', template: '%s | Doyle Roofing & Remodeling' },
  description: 'Roofing and remodeling services in Houston, TX. Explore the services, browse projects and request an estimate.',
  openGraph: { title: 'Doyle Roofing & Remodeling', description: 'Built to Protect. Designed to Improve.', type: 'website' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#222D37' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap" rel="stylesheet" />
        {/* Phosphor duotone icons, as in the design */}
        <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/duotone/style.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
