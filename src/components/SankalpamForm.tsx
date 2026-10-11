'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, CheckCircle2, Loader2, MapPin, AlertCircle } from 'lucide-react';

/**
 * The date and place for Today's Sankalpam.
 *
 * Submitting navigates to the same page with the choice in the query string,
 * and the server renders the sentence; this component computes nothing.
 *
 * The place must be PICKED from the suggestions, not just typed, for the same
 * reason as in the pooja viewer: several towns share a name and the coordinates
 * are the whole point. Submit stays disabled while the box holds text that has
 * not been resolved to one.
 */

interface Place {
  label: string;
  city: string | null;
  state: string | null;
  country: string | null;
  lat: number;
  lon: number;
  osmId: string;
}

export function SankalpamForm(props: { date: string; place: string; lat: number; lon: number }) {
  const router = useRouter();
  const [date, setDate] = useState(props.date);
  const [query, setQuery] = useState(props.place);
  const [resolved, setResolved] = useState<{ place: string; lat: number; lon: number } | null>({
    place: props.place, lat: props.lat, lon: props.lon,
  });
  const [candidates, setCandidates] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState('');
  const [submitting, startTransition] = useTransition();
  const abort = useRef<AbortController | null>(null);

  // Typeahead, debounced. Skipped while the box already says what is resolved.
  useEffect(() => {
    const q = query.trim();
    if (resolved || q.length < 2) return;
    const timer = setTimeout(async () => {
      abort.current?.abort();
      const ctl = new AbortController();
      abort.current = ctl;
      setSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { signal: ctl.signal });
        const data = (await res.json()) as { places?: Place[]; error?: string };
        const places = data.places ?? [];
        setCandidates(places);
        setActive(places.length ? 0 : -1);
        setOpen(places.length > 0);
        setStatus(places.length ? '' : data.error ? 'Place lookup failed. Try again.' : 'No match. Try adding the state or country.');
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setStatus('Place lookup failed. Try again.');
      } finally {
        if (abort.current === ctl) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, resolved]);

  const pick = (p: Place) => {
    setResolved({ place: p.label, lat: p.lat, lon: p.lon });
    setQuery(p.label);
    setOpen(false);
    setCandidates([]);
    setStatus('');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolved || !date) return;
    const qs = new URLSearchParams({
      date,
      place: resolved.place,
      lat: resolved.lat.toFixed(4),
      lon: resolved.lon.toFixed(4),
    });
    // A transition, so the button shows progress until the new result renders.
    startTransition(() => router.push(`/sankalpam?${qs}`));
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl bg-stone-900/80 border border-stone-800 p-4 sm:p-6 shadow-xl grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-4 items-start"
    >
      <div className="space-y-1.5">
        <label htmlFor="sk-date" className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-amber-400" /> Date
        </label>
        <input
          id="sk-date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-amber-500/30 text-stone-100 text-sm focus:outline-none focus:border-amber-400"
        />
      </div>

      <div className="space-y-1.5 min-w-0">
        <label htmlFor="sk-place" className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-amber-400" /> Location
        </label>
        <div className="relative">
          <input
            id="sk-place"
            type="text"
            placeholder="Start typing a city, e.g. Chennai"
            value={query}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls="sk-suggestions"
            autoComplete="off"
            onChange={(e) => {
              setQuery(e.target.value);
              setResolved(null);
            }}
            onFocus={() => candidates.length && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (!open || !candidates.length) return;
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((i) => (i + 1) % candidates.length);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((i) => (i <= 0 ? candidates.length - 1 : i - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                pick(candidates[active >= 0 ? active : 0]);
              } else if (e.key === 'Escape') {
                setOpen(false);
              }
            }}
            className="w-full px-4 py-2.5 rounded-xl bg-stone-950 border border-amber-500/30 text-stone-100 text-sm focus:outline-none focus:border-amber-400"
          />
          {searching && (
            <Loader2 className="w-4 h-4 animate-spin text-amber-400 absolute right-3 top-1/2 -translate-y-1/2" />
          )}
          {open && candidates.length > 0 && (
            <ul
              id="sk-suggestions"
              role="listbox"
              className="absolute z-30 left-0 right-0 mt-1 rounded-xl border border-amber-500/40 bg-stone-900 shadow-2xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-stone-800"
            >
              {candidates.map((p, i) => (
                <li key={p.osmId} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(p)}
                    className={`w-full text-left px-3 py-2.5 ${i === active ? 'bg-stone-800' : 'hover:bg-stone-800'}`}
                  >
                    <span className="block text-sm font-medium text-stone-100">{p.city ?? p.label}</span>
                    <span className="block text-[11px] text-stone-400">
                      {[p.state, p.country].filter(Boolean).join(', ')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {resolved ? (
          <p className="text-xs text-stone-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            {resolved.lat.toFixed(4)}, {resolved.lon.toFixed(4)}
          </p>
        ) : (
          <p className="text-xs text-amber-500/90 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {status || 'Pick a place from the suggestions.'}
          </p>
        )}
      </div>

      <div className="sm:pt-6">
        <button
          type="submit"
          disabled={!resolved || !date || submitting}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-ink-inverse font-bold text-sm flex items-center justify-center gap-1.5 shadow"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Show Sankalpam
        </button>
      </div>
    </form>
  );
}
