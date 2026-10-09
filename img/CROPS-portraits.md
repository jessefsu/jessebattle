Crops for the portraits of Jesse. Regenerate from the repo root with tools/web-photo.sh:

  tools/web-photo.sh "Site photos/Jesse overhead shot.png" img/jesse-overhead.jpg      0.50 0.50 1.00 1000 4:5 200 60
  tools/web-photo.sh "Site photos/Jesse overhead shot.png" img/jesse-overhead-500w.jpg 0.50 0.50 1.00  500 4:5  72

Args are <source> <dest> <cx> <cy> <zoom> <outWidth> <aspect> <maxKB> [quality].
The ninth is new. Left off, the script walks the quality ladder down to maxKB as
before, so every call in the other CROPS notes reproduces byte for byte (checked
against jesse-overhead at q72 and the committed reno-generator). Given, the file
is encoded once at that quality and maxKB is not enforced.

Crop notes:

jesse-overhead  Second portrait, in the #contact section of index.html, between
                the email/phone rows and "Find me elsewhere". The source is
                already a 1000x1250 4:5 crop, so both files are resized only:
                centred, zoom 1.00. It uses the hero's .home .portrait rules,
                so it renders at 30rem (480px) on desktop and 15rem (240px) at
                840px and below. sizes is "(min-width: 841px) 30rem, 15rem" and
                goes stale if that breakpoint moves.

                The two tiers are encoded at different qualities on purpose:

                  -500w  500x625    q72   70KB  1x tier, through the ladder
                  base   1000x1250  q60  153KB  2x tier, fixed quality

                The 1x file gets maxKB 72 rather than 70 because at 70 it missed
                the top rung by a few hundred bytes and dropped to q64. It is
                the file a DPR-1 desktop and a 2x phone download, so it gets the
                best rung.

                The 2x file is pinned at q60. It is only chosen on a dense
                screen -- a desktop above roughly DPR 1.04, or a phone above
                roughly 2.08 -- where each image pixel covers a physically
                smaller area and the extra compression is harder to see. That
                takes it from 198KB at q72 to 153KB. It is also the src
                fallback.

Hero headshot (not a web-photo.sh crop):

  python3 -m venv /tmp/hs && /tmp/hs/bin/pip install pillow numpy scipy
  /tmp/hs/bin/python tools/headshot.py

headshot.jpg    The hero portrait is keyed off its backdrop, edge-decontaminated
                and composited onto the ink navy, which a crop and resize cannot
                do, so it has its own script. The command above is the one in
                the tools/headshot.py docstring. Source is "Site photos/updated
                head shot with light background.jpg", the 2026-09 reshoot; the
                light backdrop is what the key needs, see the script. Output is
                605x757. headshot.jpg and the script were last changed together,
                in 5709e89.

                This entry is a pointer so every portrait command is in one
                file. The script and HANDOFF.md "Headshot recipe, and how it
                fails" stay the source of truth, including the three ways a
                rebuild goes wrong.
