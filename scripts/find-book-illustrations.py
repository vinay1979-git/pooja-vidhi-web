#!/usr/bin/env python
"""
Find the line drawings that sit in a page's margin column, and propose crops.

    python scripts/find-book-illustrations.py 1-common                 # whole file
    python scripts/find-book-illustrations.py 1-common p01 p02         # some pages
    python scripts/find-book-illustrations.py 1-common --left          # left margin
    python scripts/find-book-illustrations.py 1-common --band 0.70     # widen the band
    python scripts/find-book-illustrations.py 1-common --write         # cut them out

SCOPE, AND WHY IT IS THIS NARROW. A general "find the pictures on this page"
detector needs real document layout analysis -- glyph-scale components, grouped
into text lines, grouped into blocks, with whatever is left over called a
figure. A first attempt here tried to shortcut that with size and density rules
and it could not reliably tell a merged block of Devanagari from an inked
drawing; every threshold that caught the sparse outline sketches also caught
paragraphs.

This book does not need the general solution. It sets its mudra drawings in a
margin column beside the text, one per instruction. Looking only inside that
column turns the problem from two dimensions into one: find the rows of the
band that carry ink, and split them wherever there is a tall enough gap. That
is small enough to be reliable, and easy to check by eye.

It follows that this finds nothing on a page whose drawing is inline, and
nothing on a page with no margin column. Those are hand-measured, which is
fine -- they are the minority.

Ink is judged by LOCAL contrast against the local paper MAXIMUM, because these
photographs are lit unevenly enough that bare paper in a shadowed corner is
darker than ink in a bright one, and because a mean background is dragged down
by the drawing's own ink until a dense figure hides itself completely.

Output is a dict literal ready to paste into the CROPS table of
extract-book-illustrations.py, so every box stays reviewable and editable.
"""
import os
import sys

import numpy as np
from PIL import Image

PAGES = r"G:\My Drive\Pooja Vidhi\extracted\pages"
PROPOSED = r"G:\My Drive\Pooja Vidhi\extracted\illustrations-proposed"

BAND = 0.74        # the margin column starts here, as a fraction of page width
DARKER = 0.76      # a pixel counts as ink at this fraction of local paper
MIN_RUN = 120      # page pixels; shorter inked runs are page furniture
MIN_INK_PIXELS = 26  # dark pixels in a row before it counts as inked
                     # (tuned against hand-counted pages; below ~20 the faint
                     #  bleed-through between two figures reads as ink and
                     #  fuses them into one box)
GAP = 70           # page pixels of clear paper that separate two drawings
TIGHT_GAP = 22     # the fallback gap used to break an over-tall merged run
PAD = 14           # page pixels of margin around a found box
EDGE = 0.012       # ignore this fraction at each page edge (shadow, thumb)
MAX_H = 0.45       # fraction of page height; a taller run is the text block,
                   # found on the pages whose type runs full width and which
                   # therefore have no margin column at all


def _rowmax(a, k):
    """Sliding maximum along a 1-D array -- a grey dilation."""
    out = a.copy()
    for shift in range(1, k + 1):
        out = np.maximum(out, np.roll(a, shift))
        out = np.maximum(out, np.roll(a, -shift))
    return out


def find(path, left=False, band=BAND):
    im = Image.open(path).convert("L")
    w, h = im.size
    a = np.asarray(im, dtype=np.float32)

    ex, ey = int(w * EDGE), int(h * EDGE)
    x0, x1 = (ex, int(w * (1 - band))) if left else (int(w * band), w - ex)
    strip = a[ey:h - ey, x0:x1]

    # Per row: HOW MUCH ink, not how dark the single darkest pixel is. Judging a
    # row by its minimum marks every row as inked -- JPEG noise and the ghost of
    # the reverse side guarantee one dark pixel somewhere in any 600px run.
    paper = _rowmax(np.percentile(strip, 95, axis=1), 40)
    inked = (strip < paper[:, None] * DARKER).sum(axis=1) > MIN_INK_PIXELS

    runs, start = [], None
    for i, v in enumerate(inked):
        if v and start is None:
            start = i
        elif not v and start is not None:
            runs.append((start, i))
            start = None
    if start is not None:
        runs.append((start, len(inked)))

    def merge(rs, gap):
        out = []
        for s, e in rs:
            if out and s - out[-1][1] < gap:
                out[-1] = (out[-1][0], e)
            else:
                out.append((s, e))
        return out

    # A run taller than MAX_H is not a drawing. It is usually the whole margin
    # fused into one, which happens on a page whose figures march evenly down
    # the side with only a little bleed-through between them. Dropping it loses
    # every figure on the page in silence -- page 20 of the Purvanga file, with
    # seven nyasa mudras, produced exactly nothing until this was added. So an
    # over-tall run is re-split at a tighter gap rather than discarded.
    merged = []
    for s, e in merge(runs, GAP):
        if (e - s) <= MAX_H * h:
            merged.append((s, e))
            continue
        inner = [r for r in runs if r[0] >= s and r[1] <= e]
        merged.extend(r for r in merge(inner, TIGHT_GAP) if (r[1] - r[0]) <= MAX_H * h)

    boxes = []
    for s, e in merged:
        if e - s < MIN_RUN:
            continue
        # Tighten horizontally to the ink actually present in these rows.
        sub = strip[s:e]
        cols = sub.min(axis=0) < sub.max() * DARKER
        if not cols.any():
            continue
        cs, ce = int(np.argmax(cols)), int(len(cols) - np.argmax(cols[::-1]))
        boxes.append((
            max(0, x0 + cs - PAD), max(0, ey + s - PAD),
            min(w, x0 + ce + PAD), min(h, ey + e + PAD),
        ))
    return boxes


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    slug = sys.argv[1]
    argv = sys.argv[2:]
    left = "--left" in argv
    write = "--write" in argv
    band = BAND
    if "--band" in argv:
        band = float(argv[argv.index("--band") + 1])
    wanted = [a for a in argv if not a.startswith("--") and not a.replace(".", "").isdigit()]

    folder = os.path.join(PAGES, slug)
    files = sorted(f for f in os.listdir(folder) if f.lower().endswith((".jpeg", ".jpg", ".png")))
    if wanted:
        files = [f for f in files if os.path.splitext(f)[0] in wanted]
    if write:
        os.makedirs(os.path.join(PROPOSED, slug), exist_ok=True)

    total = 0
    for f in files:
        stem = os.path.splitext(f)[0]
        boxes = find(os.path.join(folder, f), left=left, band=band)
        if not boxes:
            print("# %s  (none)" % stem)
            continue
        print("# %s  -- %d found" % (stem, len(boxes)))
        for i, (l, t, r, b) in enumerate(boxes, 1):
            name = "%s-%s-%d" % (slug, stem, i)
            print('    "%s": ("%s", "%s", (%4d, %4d, %4d, %4d)),   # %dx%d'
                  % (name, slug, f, l, t, r, b, r - l, b - t))
            if write:
                Image.open(os.path.join(folder, f)).crop((l, t, r, b)).save(
                    os.path.join(PROPOSED, slug, name + ".png"))
            total += 1
    print("\n# %d candidates across %d pages" % (total, len(files)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
