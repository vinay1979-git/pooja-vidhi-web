import React from 'react';

/**
 * A gopuram, drawn rather than imported.
 *
 * lucide has no temple. Its nearest offers are Church, which has a cross on it,
 * and Landmark, which is a Greek portico -- both of them a building from
 * somewhere else, which is a strange thing to put at the top of an app about
 * Smartha household rites.
 *
 * So: a tapering tiered tower over a doorway, with a finial. Four paths.
 *
 * Drawn to lucide's conventions on purpose -- 24x24 viewBox, currentColor,
 * fill none, round caps and joins -- so it sits beside the other icons without
 * looking like a guest. Stroke width is 1.75 rather than lucide's 2, because
 * three tiers at 2 turn into a smudge by the time the icon is 16px on a phone.
 *
 * The tier lines are positioned on the taper, not guessed: the left edge runs
 * from x=9.2 at y=4.5 to x=5.5 at y=15, a slope of -0.352 per unit, so the
 * crossbars at y=8.5 and y=11.8 start at 7.8 and 6.6 and end symmetrically.
 * Eyeballed ones drift off the silhouette and it reads as a wonky building.
 */
export function GopuramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* finial */}
      <path d="M12 2v2.5" />
      {/* tower and base, one silhouette */}
      <path d="M9.2 4.5h5.6L18.5 15v6h-13v-6Z" />
      {/* the two tier divisions, sitting on the taper */}
      <path d="M7.8 8.5h8.4" />
      <path d="M6.6 11.8h10.8" />
      {/* doorway */}
      <path d="M10 21v-3.2a2 2 0 0 1 4 0V21" />
    </svg>
  );
}
