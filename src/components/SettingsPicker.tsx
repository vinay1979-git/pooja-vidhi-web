'use client';

import React, { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { matchesQuery, type Coverage } from '@/lib/languages';

/**
 * A settings row and the list it opens.
 *
 * WHY A LIST AND NOT A GRID OF CHIPS. The sheet used to lay every option out at
 * once, two columns wide. At two languages that is one row and it looks tidy.
 * The instruction language will not stay at two -- and the mantra script
 * certainly will not, because it is a deterministic transliteration and
 * sanscript exposes eighty-two schemes, a dozen of which are relevant here. At
 * a dozen the grid is six rows per setting, the sheet becomes a scroll, and
 * there is nowhere to type.
 *
 * A row that shows the current value costs the same height at two options and
 * at twenty. The list it opens has room for a search box, an endonym, a roman
 * name and a coverage note per entry, none of which fits in a chip.
 *
 * THE ENDONYM IS THE LABEL. Someone who reads only Telugu has to be able to
 * find Telugu, so the entry says తెలుగు first and "Telugu" underneath. The old
 * grid labelled everything in English, which quietly assumed the reader could
 * already read the language they were trying to leave.
 */

export function SettingRow({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl bg-stone-950 border border-stone-800 hover:border-amber-500/40 transition-colors text-left"
    >
      {icon}
      <span className="text-sm font-semibold text-stone-200 flex-1">{label}</span>
      <span className="text-sm text-amber-300 font-semibold">{value}</span>
      <ChevronRight className="w-4 h-4 text-stone-500 shrink-0" />
    </button>
  );
}

export interface PickerOption {
  code: string;
  endonym: string;
  roman: string;
  /** Instruction languages only. Scripts are complete by construction. */
  coverage?: Coverage;
}

/** The words under a partly-translated language. */
function coverageNote(c: Coverage): { text: string; tone: string } | null {
  if (c.level === 'full') return null;
  if (c.level === 'none') return { text: 'not translated yet', tone: 'text-stone-500' };
  return { text: `${c.done} of ${c.total} translated`, tone: 'text-amber-400/80' };
}

export function SettingsPicker({
  title,
  options,
  current,
  onPick,
  onBack,
  onClose,
  closeLabel,
  /** Below this many options a search box is clutter rather than help. */
  searchFrom = 6,
}: {
  title: string;
  options: PickerOption[];
  current: string;
  onPick: (code: string) => void;
  onBack: () => void;
  onClose: () => void;
  closeLabel: string;
  searchFrom?: number;
}) {
  const [q, setQ] = useState('');
  const showSearch = options.length >= searchFrom;

  const shown = useMemo(
    () => (showSearch ? options.filter((o) => matchesQuery(q, o.endonym, o.roman)) : options),
    [options, q, showSearch],
  );

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onBack}
          aria-label="Back to settings"
          className="p-1.5 -ml-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex-1">
          {title}
        </h2>
        <button
          onClick={onClose}
          aria-label={closeLabel}
          className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {showSearch && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 focus-within:border-amber-500/40">
          <Search className="w-4 h-4 text-amber-400 shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            // Matches the endonym and the roman name both, so "tel" and "తె"
            // each find Telugu -- you can search in the script you have.
            placeholder="Search"
            className="bg-transparent text-sm text-stone-100 focus:outline-none w-full"
          />
        </div>
      )}

      <ul className="space-y-1.5">
        {shown.map((o) => {
          const note = o.coverage ? coverageNote(o.coverage) : null;
          const selected = o.code === current;
          return (
            <li key={o.code}>
              <button
                onClick={() => onPick(o.code)}
                aria-current={selected ? 'true' : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-colors ${
                  selected
                    ? 'bg-amber-500/15 border-amber-500/50'
                    : 'bg-stone-950 border-stone-800 hover:border-amber-500/40'
                }`}
              >
                <span className="flex-1 min-w-0">
                  <span
                    className={`block text-sm font-semibold ${
                      selected ? 'text-amber-200' : 'text-stone-200'
                    }`}
                  >
                    {o.endonym}
                  </span>
                  <span className="block text-xs text-stone-500">
                    {o.roman}
                    {note && <span className={`ml-1.5 ${note.tone}`}>· {note.text}</span>}
                  </span>
                </span>
                {selected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
              </button>
            </li>
          );
        })}
        {shown.length === 0 && (
          <li className="text-xs text-stone-500 py-6 text-center">Nothing matches that.</li>
        )}
      </ul>
    </>
  );
}
