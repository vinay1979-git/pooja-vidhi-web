import type { Metadata } from 'next';
import { Cinzel, Outfit, Noto_Serif_Devanagari, Noto_Serif_Tamil } from 'next/font/google';
import './globals.css';
import Script from 'next/script';
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
//
// Dark is the default, so only an explicit 'light' opts out -- the same test as
// read() in preferences.tsx, and it has to stay the same test. The catch is not
// decoration: a private window and blocked site data both throw on
// localStorage, and a throw here with no fallback leaves <html> with whatever
// attribute the server sent.
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
        {/* next/script rather than a raw tag: React warns that scripts inside a
            component tree are not executed on client navigation, and
            beforeInteractive is what guarantees this runs ahead of first paint
            so a stored dark theme does not flash light. */}
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {THEME_BOOTSTRAP}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        <PreferencesProvider>
          {/* The bell is NOT rendered here. It was, and the catalog page also
              rendered its own, so two sat exactly on top of each other. Each
              page places it now: the catalog floats one, and the pooja viewer
              docks one in its footer so it stops covering the offering list. */}
          {children}
        </PreferencesProvider>
      </body>
    </html>
  );
}
