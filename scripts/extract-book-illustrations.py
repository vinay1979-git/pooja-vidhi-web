#!/usr/bin/env python
"""
Cut the line drawings out of the page photographs, and set the sideways pages upright.

The book illustrates the ritual -- the decorated kalasha, the mudras, the
mandapa -- and those drawings are worth more to the app than the prose around
them. They are not separate objects in the PDF though: each page is one flat
JPEG, so an illustration has to be cropped out by pixel box.

The boxes below were read off the page images by eye. They are deliberately
generous: a little surrounding white is harmless, a clipped drawing is not.

    python scripts/extract-book-illustrations.py

Idempotent. Writes into extracted/illustrations/ and extracted/pages-upright/.
"""
import os
from PIL import Image

SRC  = r"G:\My Drive\Pooja Vidhi\extracted"
PAGES = os.path.join(SRC, "pages")
ILLUS = os.path.join(SRC, "illustrations")
UPRIGHT = os.path.join(SRC, "pages-upright")

from book_illustration_boxes import BOXES

# id -> (slug, page file, (left, top, right, bottom) in the page image's own pixels)
#
# These four were measured by hand, before the detector existed, and keep their
# descriptive names because they are referenced by name from the transcripts.
# Everything else comes from BOXES, which the detector proposed and which was
# then culled on a contact sheet.
CROPS = {
    "varalakshmi-113-kalasha":        ("4-varalakshmi", "p04.jpeg", (1155,  390, 1690, 1055)),
    "varalakshmi-113-adorning-face":  ("4-varalakshmi", "p04.jpeg", ( 985, 1120, 1670, 1595)),
    "varalakshmi-113-mandapa":        ("4-varalakshmi", "p04.jpeg", ( 355, 2005, 1350, 2930)),
    "varalakshmi-114-welcoming":      ("4-varalakshmi", "p05.jpeg", ( 845, 1450, 1530, 2270)),
}
CROPS.update(BOXES)

# page file -> degrees to rotate ANTICLOCKWISE to stand the page up.
# PIL's rotate() is anticlockwise, so -90 turns a page whose top edge is
# currently on the LEFT, and +90 one whose top edge is on the RIGHT.
ROTATIONS = {
    ("4-varalakshmi", "p08.jpeg"): -90,
    ("4-varalakshmi", "p20.jpeg"):  90,
    # These two came out upside down at -90; their top edge is on the RIGHT.
    ("2-nitya", "p19.jpeg"):  90,
    ("2-nitya", "p20.jpeg"):  90,
}

def main():
    os.makedirs(ILLUS, exist_ok=True)
    print("--- illustrations ---")
    for name, (slug, page, box) in CROPS.items():
        src = os.path.join(PAGES, slug, page)
        dst = os.path.join(ILLUS, f"{name}.png")
        im = Image.open(src)
        w, h = im.size
        if box[2] > w or box[3] > h:
            print(f"  SKIP {name}: box {box} falls outside the {w}x{h} page"); continue
        im.crop(box).save(dst)
        print(f"  {name}.png  {box[2]-box[0]}x{box[3]-box[1]}  from {slug}/{page}")

    print("\n--- sideways pages set upright ---")
    for (slug, page), deg in ROTATIONS.items():
        src = os.path.join(PAGES, slug, page)
        out = os.path.join(UPRIGHT, slug)
        os.makedirs(out, exist_ok=True)
        dst = os.path.join(out, page)
        im = Image.open(src).rotate(deg, expand=True)
        im.save(dst, quality=92)
        print(f"  {slug}/{page}  rotated {deg:+d} -> {im.size[0]}x{im.size[1]}")

if __name__ == "__main__":
    main()
