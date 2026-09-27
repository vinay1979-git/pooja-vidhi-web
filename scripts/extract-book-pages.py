#!/usr/bin/env python
"""
Pull the full-resolution page photograph out of each book PDF.

Every page of these five PDFs is a single embedded JPEG -- a phone photo of a
printed page -- with no text layer at all. So the first step of any OCR is
simply to get that JPEG back out at native resolution rather than rendering the
PDF page (which would resample a 2000x3500 photo down to 595x842 points and
throw away exactly the detail the Tamil vowel signs live in).

    python scripts/extract-book-pages.py

Idempotent: skips a page whose file is already there and non-empty.
"""
import os, sys, pymupdf

SRC = r"G:\My Drive\Pooja Vidhi"
OUT = os.path.join(SRC, "extracted", "pages")

SLUGS = {
    "0.General Pooja instructions .pdf": "0-general",
    "1.Common initial Pooja .pdf":        "1-common",
    "2.Nitya Pooja .pdf":                 "2-nitya",
    "3.Siddhivinayak Vratha Pooja.pdf":   "3-siddhivinayaka",
    "4. Varalakshmi Vratha Pooja.pdf":    "4-varalakshmi",
    # A second book, and a different kind of source. The first five are phone
    # photographs of a Giri edition; this is a library scan of Bhavan's 1974
    # Sandhyavandanam, downloaded from archive.org. Lower resolution --
    # 1374x2036 against ~1900x3500 -- but flat, evenly lit and never at an
    # angle, which is the trade that matters for reading vowel signs.
    "5. Sandhyavandanam (Bhavan 1974).pdf": "5-sandhyavandanam",
    # Giri's own Sandhyavandanam -- the same publisher as books 0-4, so the same
    # Tamil Smartha recension the rest of the app already follows. Phone photos
    # again, ~2000x3500, which is why it is back to being the high-resolution
    # source and Bhavan the cross-check.
    "6. Sandhiyavandanam Giri.pdf":        "6-sandhya-giri",
}

def main():
    total = 0
    for fname, slug in SLUGS.items():
        path = os.path.join(SRC, fname)
        if not os.path.exists(path):
            print(f"  MISSING {fname}"); continue
        d = pymupdf.open(path)
        outdir = os.path.join(OUT, slug)
        os.makedirs(outdir, exist_ok=True)
        print(f"=== {slug}  ({len(d)} pages)")
        for i in range(len(d)):
            imgs = d[i].get_images(full=True)
            if len(imgs) != 1:
                print(f"  p{i+1:02d}: expected 1 embedded image, found {len(imgs)} -- rendering instead")
                pix = d[i].get_pixmap(dpi=300)
                dst = os.path.join(outdir, f"p{i+1:02d}.png")
                if not (os.path.exists(dst) and os.path.getsize(dst)):
                    pix.save(dst)
                total += 1
                continue
            xref = imgs[0][0]
            info = d.extract_image(xref)
            ext = info["ext"]
            dst = os.path.join(outdir, f"p{i+1:02d}.{ext}")
            if os.path.exists(dst) and os.path.getsize(dst):
                total += 1
                continue
            with open(dst, "wb") as f:
                f.write(info["image"])
            print(f"  p{i+1:02d}  {info['width']}x{info['height']} {ext}  {len(info['image'])//1024} KB")
            total += 1
        d.close()
    print(f"\n{total} page images in {OUT}")

if __name__ == "__main__":
    main()
