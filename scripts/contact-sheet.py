#!/usr/bin/env python
"""
Lay every proposed illustration out on one sheet, so they can all be judged at once.

    python scripts/contact-sheet.py 1-common

Writes contact-<slug>-N.png into the scratchpad. The detector proposes boxes; it
does not know whether a box actually contains a drawing. Opening sixty-seven
files one at a time to find out is not a review, it is a chore that gets skipped.
A sheet of thumbnails with their names under them is checkable in one look, and
a bad box is obvious at thumbnail size -- it is the one with text in it.
"""
import os
import sys
from PIL import Image, ImageDraw

PROPOSED = r"G:\My Drive\Pooja Vidhi\extracted\illustrations-proposed"
OUT = os.path.join(
    os.environ.get("TEMP", "."), "claude", "C--Users-vinay-code-pooja-vidhi-web",
    "43c44c61-26e6-4d43-a808-e56ae3575246", "scratchpad")

COLS, CELL, LABEL, PER_SHEET = 6, 230, 16, 30


def main():
    slug = sys.argv[1]
    folder = os.path.join(PROPOSED, slug)
    files = sorted(os.listdir(folder))
    sheets = [files[i:i + PER_SHEET] for i in range(0, len(files), PER_SHEET)]

    for n, batch in enumerate(sheets, 1):
        rows = (len(batch) + COLS - 1) // COLS
        sheet = Image.new("RGB", (COLS * CELL, rows * (CELL + LABEL)), "white")
        d = ImageDraw.Draw(sheet)
        for i, f in enumerate(batch):
            im = Image.open(os.path.join(folder, f))
            im.thumbnail((CELL - 8, CELL - 8))
            x = (i % COLS) * CELL + (CELL - im.size[0]) // 2
            y = (i // COLS) * (CELL + LABEL) + (CELL - im.size[1]) // 2
            sheet.paste(im, (x, y))
            d.text(((i % COLS) * CELL + 4, (i // COLS) * (CELL + LABEL) + CELL + 2),
                   f.replace(slug + "-", "").replace(".png", ""), fill="black")
        path = os.path.join(OUT, "contact-%s-%d.png" % (slug, n))
        sheet.save(path)
        print(path, "%d images" % len(batch))


if __name__ == "__main__":
    main()
