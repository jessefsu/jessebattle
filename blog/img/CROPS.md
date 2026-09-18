Crops for blog post imagery. Regenerate with tools/web-photo.sh:

  tools/web-photo.sh "Site photos/contractor invoices.jpg" blog/img/uad-3-6-documentation.jpg       0.50 0.46 0.95 1600 16:9 200
  tools/web-photo.sh "Site photos/contractor invoices.jpg" blog/img/thumb-uad-3-6-documentation.jpg 0.52 0.50 0.58  480 5:4   40

Args are <source> <dest> <cx> <cy> <zoom> <outWidth> <aspect> <maxKB>.

Two derivatives per post, because two pages consume different files:

  blog/img/<slug>.jpg        1600x900, the post's lead image AND the card on
                             /blog/, which uses the full hero rather than a thumb
  blog/img/thumb-<slug>.jpg  480x384, the card on the homepage only

Both have to be updated together, along with og:image, twitter:image,
twitter:image:alt and the JSON-LD "image" in the post — six references in three
files for a single photo swap.

uad-3-6-documentation  Added 2026-09-18, replacing uad-3-6-framing.jpg. That
                       photograph was in three placements across two pages --
                       the renovation hero at full bleed, this post's lead, and
                       this post's card -- which the design audit flagged as its
                       most over-used image. It now appears only as the
                       renovation hero, via img/reno-hero-framing.jpg. Source is
                       7000x4880 and Unsplash+ licensed. cy 0.46 keeps the
                       invoices, binder and calculator and crops the head out at
                       the bottom edge.

Note on size: these heroes are 1600x900 by house convention, but since the
design pass a post's lead image breaks out to --img-wide and renders up to
1600px at a 1920 viewport, so it is now exactly 1x there rather than the 2.25x
it was at 712px. That applies to all four post heroes equally and is worth
fixing for all of them at once rather than one at a time.
