import type { PoojaModeOption } from '@/types/pooja';

/**
 * Which sitting the reader is in, by the clock on their own device.
 *
 * Sandhyavandanam is performed three times a day and the picker opened on the
 * morning whatever the hour, so anyone sitting down at dusk was shown the dawn
 * rite and had to correct it every single time. The rule agreed for this was a
 * plain one -- before 11:00 morning, 11:00 to 16:00 noon, after 16:00 evening --
 * and it lives in pooja_modes.from_hour rather than here, because the hours are
 * the rite's and this file must not know the words pratah or sayam.
 *
 * A GUESS, NOT A RULING. The picker stays fully changeable and nothing is
 * hidden. The boundaries are conventional rather than astronomical: real
 * sandhya times track sunrise and sunset, which move by weeks over the year and
 * would need the reader's place, the date and an almanac -- none of which this
 * rite asks for, deliberately, since it takes no name, no gotra and no date.
 * The book itself hands the one genuinely sun-dependent instruction back to the
 * reader, telling them to face west before sunset and east after, because no
 * clock can answer that. So the bar here is only that the picker should open on
 * the likely answer instead of always the same one.
 */

/**
 * The mode whose window contains `hour`, or null if the clock has nothing to
 * say about this pooja.
 *
 * Null is the ordinary answer. Only rites that recur with the day set hours at
 * all; a multi-day observance has days, and there is no time of the afternoon
 * at which a Punar Pooja becomes correct.
 */
export function modeForHour(
  modes: PoojaModeOption[] | undefined,
  hour: number,
): string | null {
  if (!modes?.length) return null;
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;

  // The latest window that has already begun. Sorting by from_hour rather than
  // by seq: they agree today, and the rule must hold if a rite ever declares
  // them out of order.
  let best: PoojaModeOption | null = null;
  for (const m of modes) {
    if (typeof m.from_hour !== 'number') continue;
    if (m.from_hour > hour) continue;
    if (!best || m.from_hour > (best.from_hour as number)) best = m;
  }

  // Nothing has begun yet, which means the earliest window starts after
  // midnight and the small hours belong to no mode. 0051 refuses to write that,
  // but the client reads whatever the database holds and must not answer with
  // a mode it made up. The caller keeps its own default.
  return best ? best.mode : null;
}

/** Split out so a test can pass an hour instead of waiting for one. */
export function currentMode(
  modes: PoojaModeOption[] | undefined,
  now: Date = new Date(),
): string | null {
  return modeForHour(modes, now.getHours());
}
