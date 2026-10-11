import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Flame, Sunrise } from 'lucide-react';
import { computePanchangam, type Slot } from '@/lib/panchangam';
import { renderSankalpamCore } from '@/lib/sankalpam';
import { GopuramIcon } from '@/components/GopuramIcon';
import { SankalpamForm } from '@/components/SankalpamForm';

export const metadata: Metadata = {
  title: "Today's Sankalpam · Pooja Vidhi",
  description: 'The panchangam part of the Sankalpam for any day and place.',
};

/**
 * Today's Sankalpam: only the part of the sentence that changes with the day.
 *
 * The preamble, the gotra and the purpose are the reader's own and do not move;
 * what has to be looked up every morning is the samvatsara-to-karana run in the
 * middle. This page renders exactly that, from the same engine the Sankalpam
 * step uses, so the two can never disagree.
 *
 * The query string IS the form state -- ?date=&place=&lat=&lon= -- so the page
 * renders on the server, a result can be bookmarked or sent, and submitting is
 * an ordinary navigation. Nothing is passed means today, at Pune.
 */

const PUNE = { place: 'Pune, Maharashtra, India', lat: 18.5204, lon: 73.8567 };
const TZ = 'Asia/Kolkata';

/** Today's date where the reader is assumed to be, not where the server is. */
function todayInIndia(): string {
  // en-CA formats as YYYY-MM-DD, which is what <input type="date"> wants.
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TodaysSankalpamPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const rawDate = one(sp.date);
  const date = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : todayInIndia();

  const lat = Number(one(sp.lat));
  const lon = Number(one(sp.lon));
  const place = one(sp.place)?.trim();
  // A place is taken only with both coordinates in range; a label alone would
  // be a sankalpam computed for Pune and captioned with somewhere else.
  const geo =
    place && Number.isFinite(lat) && Number.isFinite(lon) &&
    Math.abs(lat) <= 90 && Math.abs(lon) <= 180
      ? { place, lat, lon }
      : PUNE;

  // Midday, so the civil day is unambiguous. The engine picks the tithi at
  // sunrise itself.
  const at = new Date(`${date}T12:00:00+05:30`);
  const p = computePanchangam(at, geo.lat, geo.lon, TZ);

  const dateLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ,
  }).format(at);

  // The engine returns an ISO timestamp in the local zone; the clock time is
  // characters 11-16 of it.
  const sunrise = p?.sunriseLocal?.match(/T(\d{2}:\d{2})/)?.[1];

  const rows: [string, Slot | null][] = p
    ? [
        ['Samvatsara', p.samvatsara],
        ['Ayana', p.ayana],
        ['Ritu', p.ritu],
        ['Masa (solar)', p.masa],
        ['Paksha', p.paksha],
        ['Tithi', p.tithi],
        ['Then (upari)', p.tithiUpari],
        ['Vasara', p.vasara],
        ['Nakshatra', p.nakshatra],
        ['Yoga', p.yoga],
        ['Karana', p.karana],
      ]
    : [];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans pb-20">
      <header className="sticky top-0 z-40 bg-stone-900/90 backdrop-blur-md border-b border-amber-500/20 shadow-xl">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-ink-inverse shadow-lg shadow-amber-600/30">
              <GopuramIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-lg md:text-xl font-black bg-gradient-to-r from-amber-200 via-amber-400 to-amber-300 bg-clip-text text-transparent tracking-wide">
                Pooja Vidhi
              </p>
              <p className="text-xs text-amber-400/80 font-medium flex items-center gap-1 group-hover:text-amber-300">
                <ArrowLeft className="w-3 h-3" /> Home
              </p>
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 sm:pt-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-amber-100 flex items-center gap-2">
            <Flame className="w-7 h-7 text-amber-400" /> Today&apos;s Sankalpam
          </h1>
          <p className="text-sm text-stone-400">
            The part of the Sankalpam that changes with the day, from the samvatsara to the karana.
          </p>
        </div>

        <SankalpamForm date={date} place={geo.place} lat={geo.lat} lon={geo.lon} />

        {!p ? (
          <p className="text-sm text-red-300 rounded-2xl border border-red-500/30 bg-red-950/20 p-4">
            The panchangam could not be computed for this date and place.
          </p>
        ) : (
          <>
            <section className="rounded-2xl bg-amber-950/20 border border-amber-500/40 p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-amber-500/20 pb-3">
                <p className="text-amber-300 font-bold">{dateLabel}</p>
                <p className="text-xs text-stone-400">
                  {geo.place}
                  {sunrise && (
                    <span className="inline-flex items-center gap-1 ml-2">
                      <Sunrise className="w-3.5 h-3.5 text-amber-400" /> Sunrise {sunrise}
                    </span>
                  )}
                </p>
              </div>

              <p lang="sa" className="font-deva text-lg sm:text-xl leading-loose text-amber-100">
                {renderSankalpamCore(p, 'deva')}
              </p>
              <p lang="ta" className="font-tamil text-base sm:text-lg leading-loose text-amber-200/90">
                {renderSankalpamCore(p, 'tamil')}
              </p>
              <p className="text-sm sm:text-base italic leading-relaxed text-stone-300">
                {renderSankalpamCore(p, 'iast')}
              </p>
            </section>

            <section className="rounded-2xl bg-stone-900/80 border border-stone-800 p-4 sm:p-6 shadow-xl">
              <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-3">
                The day, element by element
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {rows
                  .filter(([, s]) => s)
                  .map(([label, s]) => (
                    <div key={label} className="flex items-baseline justify-between gap-3 border-b border-stone-800/70 py-1.5">
                      <dt className="text-stone-400 text-xs font-semibold">{label}</dt>
                      <dd className="text-right">
                        <span lang="sa" className="font-deva text-amber-100">{s!.deva}</span>
                        <span className="text-stone-400 italic ml-2">{s!.iast}</span>
                      </dd>
                    </div>
                  ))}
              </dl>
              {p.meta.lunarMasaName && (
                <p className="text-xs text-stone-500 mt-3">
                  Lunar month {p.meta.lunarMasaName}, shown for reference. Tamil Smartha recites the solar month.
                </p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
