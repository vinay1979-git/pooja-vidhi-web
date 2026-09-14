import type { Metadata } from 'next';
import { Cinzel, Outfit, Noto_Serif_Devanagari, Noto_Serif_Tamil } from 'next/font/google';
import './globals.css';
import { PreferencesProvider } from '@/lib/preferences';

// The Divine Design System's four faces. Previously only Geist was loaded, so
// every line of Sanskrit and Tamil rendered in a silent Latin fallback.
const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
});
const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});
const notoDevanagari = Noto_Serif_Devanagari({
  variable: '--font-noto-deva',
  subsets: ['devanagari'],
  weight: ['400', '600'],
  display: 'swap',
});
const notoTamil = Noto_Serif_Tamil({
  variable: '--font-noto-tamil',
  subsets: ['tamil'],
  weight: ['400', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pooja Vidhi',
  description:
    'A guided Tamil Smartha pooja vidhanam with live Sankalpam, in Sanskrit, Tamil and transliteration.',
};

// Applied before first paint so a stored light theme does not flash dark.
// Kept deliberately tiny and dependency-free.
const THEME_BOOTSTRAP = `
try {
  var p = JSON.parse(localStorage.getItem('pooja-vidhi:prefs') || '{}');
  document.documentElement.setAttribute('data-theme', p.theme === 'light' ? 'light' : 'dark');
} catch (e) {
  document.documentElement.setAttribute('data-theme', 'dark');
}
`;

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${cinzel.variable} ${outfit.variable} ${notoDevanagari.variable} ${notoTamil.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="min-h-full flex flex-col">
        <PreferencesProvider>{children}</PreferencesProvider>
      </body>
    </html>
  );
}
