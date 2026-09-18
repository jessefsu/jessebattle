# Design consistency pass — seven staged commits

Working doc for a multi-commit design system pass on jessebattle.com. Written
so a cold session can pick this up mid-sequence. Not served: `*.md` is in
`.assetsignore`, so this is in the repo and 404s on the web.

**Status: stages 1–2 of 7 landed. Stages 3–7 remain.**

---

## Why

An audit at 1680px found the navigation rendering wider than the content on
five of eight pages, and no shared system underneath the visual language. The
palette, the three typefaces (Archivo / Source Serif 4 / JetBrains Mono) and
the blueprint motifs are good and are **not** being changed. The system beneath
them is what this pass fixes.

## Audit numbers (measured 2026-09-18, before stage 1)

Container widths at 1680px:

| Page | content | nav | footer |
|---|---|---|---|
| Home | 1024 | 1024 | 1024 |
| Renovation | 1024 | 1024 | 1024 |
| Writing index | **768** | 1024 | 1024 |
| All 4 posts | **768** | 1024 | 1024 |

`.foot-social .wrap` was pinned to 768 and appears on blog pages only, so a
post stacked nav 1024 / article 768 / social 768 / footer 1024.

Seven distinct container widths existed: 768, 1024, 1180, 1360, 1512, 760, 100vw.
Four of those seven existed only on the renovation page.

Other findings:

- **10 distinct heading renderings.** H1 is 65.6px on Home/Renovation and
  34.4px on Writing/posts — exactly 1.9x, because `--d1` vs `--d2`.
- **4 body sizes** for running prose: 17.2 / 18.4 / 15.2 / 14px.
- **Image tiers:** Home maxes at 320px, Writing index 297, posts a single 712,
  renovation 367/577/928/1512/1680.
- **Vertical spacing:** 29, 38, 44, 48, 64, 72, 88, 104, 112 — no common unit.
- **Section headers:** the eyebrow-plus-rule exists on renovation only (6 uses).
  Home has an eyebrow with no rule. Posts have bare `article h2`.
- **62 rule blocks live in inline `<style>`** across the 4 blog posts.
- **36 real `max-width` declarations** (plus 25 `@media(max-width:)`
  breakpoints, which a naive grep conflates — 59 total string hits).
  19 were `ch` measures, 13 were layout containers, 4 were resets.
- **Blog card thumbnails:** 240x350/375/350/275 boxes fed by 1600x900 sources
  with `object-fit:cover`. Crop loss is **51–64%**, not 75%, and it *varies per
  card* because the card is a grid row sized by its own text.
- **7 orphaned images** still served: the six `img/inspiration-*.jpg` and
  `img/reno-kitchen-island.jpg`. ~1.4MB.
- **Two photographs appear in multiple places.** `Site photos/uad-3-6-framing.jpg`
  is the renovation hero (1680 full-bleed), the UAD post lead (712) and the UAD
  card (240) — three placements, different crops, same photo.
  `Site photos/kitchen.jpg` feeds `blog/img/quartzite-kitchen.jpg`,
  `img/inspiration-cabinet-detail.jpg` and `img/reno-kitchen-range.jpg`.

## Decisions taken by the owner

1. **Drop the renovation alternating-side pattern.** Constant-width rows,
   vary the column count: 2-up grid tiles, 4-up specialty.
2. **Homepage lead image:** do **not** reuse `reno-hero-framing.jpg` — that
   photo is already in three places. Instead promote the portrait to ~480px and
   run the Pinellas map at content width. A proper homepage lead photo is a
   content problem the owner will solve separately.
3. Leave the 13 breakpoints alone this pass.
4. Do not touch mobile until desktop is consistent.
5. Report exact rule counts after each stage, not estimates.

---

## The stages

### Stage 1 — widths — **DONE, commit `4e30203`**

`.wrap` became `--w-content` (64rem) globally; the five overrides deleted
(`nav .wrap`, `footer .wrap`, `.home .wrap`, `.reno .wrap`, both
`.foot-social .wrap`). Seven prose caps collapsed to `--w-measure` (68ch) with
two documented exceptions (`.home .hat p` 34ch in the three-up strip,
`.home .writing-head .deck` 38ch beside its heading).

Two things surfaced that were not in the plan:

- `article p/ul/ol/blockquote` had **no** measure cap. The 48rem container was
  doing that job by accident; widening it ran post prose to 968px (~110ch).
  Cap added. `.foot-social p` was uncapped for the same reason and is now capped.
- Deleting the `.reno .wrap` comment block by index left a dangling
  `.foot-social .wrap,.reno ` fragment that merged with the next rule and gave
  `.foot-social .wrap` `width:100vw`. Invisible at 1440 (masked by the 1024
  max-width), visible only at 768. Fixed. **The mobile invariant check is the
  only reason it was caught** — keep running it.

Result at 1440 on a post: nav 1024 / content 1024 / social 1024 / footer 1024.
Post prose measure 601px = 68ch.

### Stage 2 — type — **DONE, commit `45fb0e7`**

Global `h1` and `.wh h1` moved `--d2` -> `--d1`, so Writing index and all four
posts render the page title at the same size as Home and Renovation.

`--lead` now has exactly two users, both decks directly under an H1:
`.wh .deck` and `.home .kicker`. Three demotions to `--base`:
`.home .close-deck`, `.home .writing-head .deck`, `.reno-note`.
`--xsmall` stays on `.sourcenote` in the blog inline styles (folded in at
stage 7).

**Owner decision — mobile H1 moves, and that is intended.** `--d1` is a fluid
clamp with a different floor than `--d2`, so Writing H1 goes 28 -> 38.4 at
320 and 28 -> 47.6 at 768. Scoping it to desktop would need a media query,
which is out of scope this pass. Home and Renovation already rendered 38.4 at
320, so this aligns all eight pages rather than breaking anything. Everything
else at mobile is byte-identical to production: eyebrow 14, deck 18.4, card
title 20, card copy 15.2, body 14/15.2/17.2.

**Caught and reverted:** adding `font-size:var(--lead)` to `.page-head p` also
matched `p.eyebrow` and blew the mono eyebrow 14 -> 18.4px on every blog page.
`.page-head` on posts contains only an eyebrow and an `h1` — there is no deck
there to style, and blog index's deck already gets `--lead` from `.wh .deck`.
Rule reverted entirely.

### Stage 3 — images and cards — TODO
Fixed 16:9 thumbnail box on blog cards so the crop stops depending on summary
length. Extend the renovation tier system site-wide. Post lead images to
`--img-wide`.

### Stage 4 — section headers — TODO
The eyebrow-plus-rule from renovation, used on every page. One pattern
replaces four divergent treatments.

### Stage 5 — renovation rows — TODO
Constant-width rows, varying column count. 2-up grid tiles, 4-up specialty.
Removes the 332px (22%) and 752px (50%) voids beside the supporting rows.

### Stage 6 — homepage — TODO
Portrait 320 -> ~480px. Pinellas map at content width. (Note: the map already
grew 297 -> 412 as a side effect of stage 1's container change.)

### Stage 7 — cleanup — TODO
Delete the 7 orphaned images. Fold the 62 inline `<style>` rules into
`style.css`.

---

## Verification protocol — run after every stage

Measure **one live page at a time** with a plain script against the local
wrangler dev server. Do not build an iframe harness: it hammers the dev server
and the server wedges (it did repeatedly during the audit — restart it with
preview_stop/preview_start when `curl localhost:8787/` starts returning 000).
Clear image `src` or block images before measuring; container widths and
computed text styles are all that matter.

Widths to check: **1440 and 1920** for the change, **320 and 768** to prove
mobile did not move.

Compare mobile against **production**, not against a stored number — the
working tree being clean means production is the previous stage's state, and
comparing like-for-like avoids measurement-method artifacts. An iframe reserves
a scrollbar and reports 305 where a real 320 viewport reports 320; that
difference is the harness, not a regression.

## Rule counts

| Point | lines | rule blocks | selectors | declarations |
|---|---|---|---|---|
| Before stage 1 | 663 | 349 | 359 | 918 |
| After stage 1 | 670 | 346 | 358 | 919 |

Plus 62 rule blocks in inline `<style>` across 4 blog posts, untouched until
stage 7.
