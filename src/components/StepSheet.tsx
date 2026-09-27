'use client';

import React, { useEffect, useRef } from 'react';
import { Check, CircleDot, SkipForward, X } from 'lucide-react';
import type { PoojaStep } from '@/types/pooja';

/**
 * Every step of the rite, on one surface, in three sections.
 *
 * WHAT THIS REPLACES. A native <select> in the step header holding thirty-nine
 * options. It worked, and nobody found it: it looks like a form field rather
 * than navigation, it only exists once you are already inside a step, and it
 * tells you nothing about where you have got to. A dropdown is a control for
 * choosing a value. This is a table of contents.
 *
 * GROUPED BY phase, which pooja_steps has carried since 0002 and nothing has
 * ever shown: purvangam, pradhana, uttara. Thirty-nine flat rows is a wall;
 * the same thirty-nine under three headings is a rite with a beginning, a
 * middle and an end, and you can see at a glance which part you are in.
 *
 * THREE STATES, AND THE THIRD IS THE INTERESTING ONE.
 *   done      -- behind you. A check.
 *   current   -- where you are. Highlighted, and scrolled to on open.
 *   skipped   -- exists, but not for this karta. Shown and marked rather than
 *                hidden, because knowing a step exists and is not yours is
 *                worth knowing. It is not selectable.
 *
 * Steps belonging to another day are absent entirely rather than greyed: a
 * Punar Pooja step is not part of today's rite at all, so listing it would be
 * offering something that does not exist right now. That is a different thing
 * from a step this karta does not perform, and the two must not look alike.
 */

export interface StepSheetProps {
  title: string;
  closeLabel: string;
  steps: PoojaStep[];
  /** Index into `steps`. -1 while still on the preparation screen. */
  currentIndex: number;
  /** Highest index reached this sitting; everything below it reads as done. */
  furthestIndex: number;
  isInMode: (s: PoojaStep) => boolean;
  isForKarta: (s: PoojaStep) => boolean;
  /** Step title in the reader's language, resolved by the caller. */
  titleOf: (s: PoojaStep) => string;
  phaseLabel: (phase: string) => string;
  skippedLabel: string;
  onPick: (index: number) => void;
  onClose: () => void;
}

const PHASE_ORDER = ['purvangam', 'pradhana', 'uttara'];

export function StepSheet({
  title,
  closeLabel,
  steps,
  currentIndex,
  furthestIndex,
  isInMode,
  isForKarta,
  titleOf,
  phaseLabel,
  skippedLabel,
  onPick,
  onClose,
}: StepSheetProps) {
  const currentRef = useRef<HTMLLIElement | null>(null);

  // Open on the step you are on rather than at the top. Opening a
  // thirty-nine-item list at item one, to find item fourteen, is the scrolling
  // this sheet exists to remove.
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center' });
  }, []);

  // Keep the rite's own order. Sorting by phase would be wrong even though the
  // phases happen to run in order: step_number is the sequence the book gives,
  // and a mis-tagged phase must show up as an odd heading rather than silently
  // reorder the liturgy.
  const rows = steps
    .map((s, index) => ({ s, index }))
    .filter(({ s }) => isInMode(s));

  const groups: { phase: string; items: typeof rows }[] = [];
  for (const row of rows) {
    const phase = (row.s as { phase?: string }).phase ?? 'pradhana';
    const last = groups[groups.length - 1];
    if (last && last.phase === phase) last.items.push(row);
    else groups.push({ phase, items: [row] });
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
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

      <div className="space-y-4">
        {groups.map((g, gi) => (
          <div key={`${g.phase}-${gi}`}>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5 px-1">
              {phaseLabel(g.phase)}
            </h3>
            <ul className="space-y-1">
              {g.items.map(({ s, index }) => {
                const current = index === currentIndex;
                const skipped = !isForKarta(s);
                const done = !skipped && index < furthestIndex && index !== currentIndex;
                return (
                  <li key={s.id || index} ref={current ? currentRef : undefined}>
                    <button
                      onClick={() => !skipped && onPick(index)}
                      disabled={skipped}
                      aria-current={current ? 'step' : undefined}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors border ${
                        current
                          ? 'bg-amber-500/15 border-amber-500/50'
                          : skipped
                            ? 'bg-transparent border-transparent cursor-not-allowed'
                            : 'bg-stone-950/60 border-stone-800/70 hover:border-amber-500/40'
                      }`}
                    >
                      <span className="w-5 shrink-0 flex justify-center">
                        {current ? (
                          <CircleDot className="w-4 h-4 text-amber-400" />
                        ) : skipped ? (
                          <SkipForward className="w-3.5 h-3.5 text-stone-600" />
                        ) : done ? (
                          <Check className="w-4 h-4 text-amber-500/80" />
                        ) : (
                          <span className="text-[11px] font-semibold text-stone-600">
                            {index + 1}
                          </span>
                        )}
                      </span>
                      <span
                        className={`flex-1 min-w-0 text-sm truncate ${
                          current
                            ? 'text-amber-200 font-semibold'
                            : skipped
                              ? 'text-stone-600'
                              : done
                                ? 'text-stone-400'
                                : 'text-stone-200'
                        }`}
                      >
                        {titleOf(s)}
                      </span>
                      {skipped && (
                        <span className="text-[10px] text-stone-600 shrink-0">{skippedLabel}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

export { PHASE_ORDER };
