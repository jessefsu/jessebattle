Crops for blog post imagery. Regenerate with tools/web-photo.sh:

  tools/web-photo.sh "Site photos/flhomes2.jpg"             blog/img/florida-subdivision-aerial.jpg      0.50 0.50 1.00 2400 16:9 360
  tools/web-photo.sh "Site photos/stpetebchcondo2.jpg"      blog/img/st-pete-beach-condos-aerial.jpg     0.50 0.50 1.00 2400 16:9 360
  tools/web-photo.sh "Site photos/contractor invoices.jpg"  blog/img/uad-3-6-documentation.jpg           0.50 0.46 0.95 2400 16:9 360
  tools/web-photo.sh "Site photos/contractor invoices.jpg"  blog/img/thumb-uad-3-6-documentation.jpg     0.52 0.50 0.58  480 5:4   40

Args are <source> <dest> <cx> <cy> <zoom> <outWidth> <aspect> <maxKB>.

Two derivatives per post, because two pages consume different files:

  blog/img/<slug>.jpg        2400x1350, the post's lead image AND the card on
                             /blog/, which uses the full hero rather than a thumb
  blog/img/thumb-<slug>.jpg  480x384, the card on the homepage only

Both have to be updated together, along with og:image, twitter:image,
twitter:image:alt and the JSON-LD "image" in the post -- six references in three
files for a single photo swap.

HOUSE CONVENTION: post heroes are 2400x1350, cap 360KB.

Raised from 1600x900 on 2026-09-18. Since the design pass a post's lead image
breaks out to --img-wide and renders up to 1600px at a 1920 viewport, so a
1600-wide file was exactly 1x there rather than the 2.25x it had been at 712px.
2400 restores 1.5x at 1920 and stays 2x or better at every narrower breakpoint.

The 360KB cap is the real constraint, not the width. These are above the fold,
and at 2400 they land at roughly 1.7-1.9x their old byte size rather than the
clean 2x you would expect, because the quality ladder drops a rung or two to
hold the cap. Judge any replacement at render size, not at 100%.

The ladder in tools/web-photo.sh was extended to "72 64 58 52 46 40 34 30 26" on
2026-09-18 to make that cap reachable for the densest sources. The ladder takes
the highest quality that fits, so the new rungs only ever engage on an image that
would otherwise overshoot.

florida-subdivision-aerial  The pathological one. Aerial texture everywhere --
                            shingles, grass, tree canopy -- so there is no
                            low-entropy area to squeeze and the size/quality
                            curve is nearly flat: q34 gives 471KB and q24 still
                            gives 338KB. Lands at q26 / 369KB, marginally over
                            cap, which is the floor for this frame at this width.
                            Checked at render scale against both the old q40
                            1600x900 and a q34 2400 render: no visible
                            difference at 1600px. Do not chase the cap harder
                            here; drop the width instead if it ever has to come
                            down.

uad-3-6-documentation       Added 2026-09-18, replacing uad-3-6-framing.jpg. That
                            photograph was in three placements across two pages --
                            the renovation hero at full bleed, this post's lead,
                            and this post's card -- which the design audit flagged
                            as its most over-used image. It now appears only as the
                            renovation hero, via img/reno-hero-framing.jpg. Source
                            is 7000x4880 and Unsplash+ licensed. cy 0.46 keeps the
                            invoices, binder and calculator and crops the head out
                            at the bottom edge.

quartzite-kitchen           EXCEPTION: still 1600x900. Its source is not in the
                            repo and not in Site photos/. The file entered in
                            commit 7ee982e "Add files via upload", a GitHub web
                            upload, so no local original ever existed. Ruled out
                            by comparison against every kitchen frame on hand:
                            kitchen.jpg, kitchen with island.jpg, kitchen wide
                            angle.jpg (MAE 40-49, against 0.90-3.81 for a
                            confirmed match) and kitchen finished.jpg, which is
                            coincidentally already 2400x1350 but is a different,
                            much brighter room. Not upscaled. To bring this one
                            to convention, supply the original at 2400 wide or
                            better and run it through the ladder like the others.
