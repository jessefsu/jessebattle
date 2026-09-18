# Handoff notes: jessebattle.com

Everything you need to pick this up in Claude Code.

---

## What this is

A static personal site for Jesse Battle IV. Plain HTML and CSS, no framework,
no build step. Every file is hand-editable.

**Repo:** github.com/jessefsu/jessebattle
**Host:** Cloudflare Workers, project name `jessebattle`
**Live now:** https://jessebattle.jessefsu.workers.dev
**Real domain:** https://jessebattle.com and https://www.jessebattle.com
(both live; apex and www are separate custom domains on the same Worker and
serve identical content with no redirect between them)

Push to `main` on GitHub and Cloudflare rebuilds and redeploys automatically,
usually within two minutes.

---

## Getting set up in Claude Code

1. Open Terminal
2. Pick a folder to work in, e.g. `cd ~/Sites`
3. `git clone https://github.com/jessefsu/jessebattle.git`
4. `cd jessebattle`
5. `claude`

### Previewing locally

Use wrangler, not a plain static server:

```
npx wrangler dev --assets=. --compatibility-date=2026-08-15
```

Then open the URL it prints (usually `http://localhost:8787`). This matches
how Cloudflare actually serves the site, including extensionless URLs.

Do not use `python3 -m http.server` for a full check. It serves files
literally, so the blog post at `/blog/2026-kitchen-bath-trends-st-pete`
returns a **404 that is not real** — the page is fine in production. That
routing (serving `foo.html` at `/foo`) comes from Cloudflare Workers Assets,
which a plain static server does not replicate. `python3 -m http.server 8000`
is still fine for a quick look at the homepage or CSS.

Either way, do not open `index.html` by double-clicking it. That breaks paths.

**URL convention:** post files still end in `.html` on disk, but every link
to them — nav links, the blog index, `sitemap.xml`, `canonical`, `og:url`,
and the JSON-LD `url` — omits the `.html`. Linking to the `.html` form works
but costs a 307 redirect, which is worth avoiding for crawlers. The example
blocks in `blog/index.html` and `sitemap.xml` already use the correct form,
so copying them keeps it right.

To publish: `git add -A && git commit -m "what changed" && git push`

---

## File map

```
index.html                             homepage markup; no inline CSS
style.css                              ALL styles for every page. Shared rules
                                       first, then a .home-scoped block for
                                       homepage-only layout
robots.txt                             crawler rules, allows everything
sitemap.xml                            add a <url> block per new post
.assetsignore                          what the Worker must NOT serve. See
                                       "What is in the repo but not on the web"
.gitignore                             keeps .DS_Store and editor junk out of
                                       the repo
tools/headshot.py                      executable form of the headshot recipe.
                                       In the repo, never served
llms.txt                               plain-language summary for AI agents
share.js                               the only JavaScript on the site. Powers
                                       copy-link and the phone share sheet on
                                       article pages; see Share row below
social-home.jpg                        1200x630 preview card for the homepage
social-writing.jpg                     1200x630 preview card for /blog/. Both
                                       are crawler-only; no page loads them
headshot.jpg                           hero portrait, pre-processed
pb-logo.png                            Pinellas Builders mark
pelican.png                            real estate badge, original colours
blog/index.html                        the Writing index
blog/2026-kitchen-bath-trends-st-pete.html
blog/2026-st-pete-condo-deadlines.html
blog/2026-institutional-investor-ban-tampa-bay.html
blog/img/                              processed hero and inline images, one
                                       or more per post
HOW-TO-POST.md                         non-technical posting instructions
```

**Photos.** Full-resolution originals live in `Site photos/`, which is
git-ignored on purpose. Only processed derivatives in `blog/img/` are
committed. That matters because the Worker serves the repo root, so anything
committed is publicly downloadable at full size. Process to the house spec
before committing: 2400x1350 for a post hero, progressive JPEG, cap 360KB.
(Raised from 1600x900 / 150-200KB on 2026-09-18 -- see the render-size note
below. Other slots keep their own sizes; see img/CROPS-reno.md.)
Keep the original in `Site photos/` so a photo can be re-cropped later without
re-shooting it.

**Quality is set by the file size, not by a fixed number.** The cap is the
target -- 360KB for a post hero, 150-200KB for smaller slots -- and
`tools/web-photo.sh` takes its `maxKB` argument and walks a quality ladder
down until the output fits, so you pass a size, not a number. The JPEG
quality that gets you there depends entirely on how much
high-frequency detail the frame holds, and the spread is much wider than it
looks. Tune quality to hit the size — do not reuse a number from a previous
photo.

```
portrait / soft background   q 80-92    few edges, compresses cheaply
condo + sky + water          q 60-75    mid detail
top-down aerial              q ~40      shingle, foliage and asphalt texture
                                        edge to edge; q60 was still 260KB
```

Output size matters as much as subject. That same aerial-type texture takes
q=88 at 1200x630 (`social-writing.jpg`, 193KB) because downsampling to 1200px
has already discarded most of the fine detail that was expensive at 1600px.
Tune per file; the table is a starting point, not a lookup.

**The ladder is `72 64 58 52 46 40 34 30 26`** (in `tools/web-photo.sh`). It
takes the **highest** quality that fits `maxKB`, so the rungs below 34 only
ever engage on a source dense enough to overshoot at 34 -- adding them cannot
lower the quality of any image that was already fitting. The 30 and 26 rungs
were added 2026-09-18 for exactly one frame; everything else on the site still
lands at 40 or above. If a photo bottoms out at 26 and is still over cap,
reduce the output width rather than extending the ladder further.

### Responsive images — srcset and sizes

Added 2026-09-18. A single large file is the wrong answer on a phone: before
this, a 390px-wide phone downloaded the full 2400w hero, 377KB for a 334px
slot. Every image large enough to matter now ships at several widths and the
browser picks.

**Naming.** The base file keeps its name and is always the LARGEST width, so
`src` stays a valid fallback for anything that ignores `srcset`. Smaller ones
take a `-<width>w` suffix:

```
blog/img/florida-subdivision-aerial.jpg        2400w   <- base, and src
blog/img/florida-subdivision-aerial-1600w.jpg  1600w
blog/img/florida-subdivision-aerial-800w.jpg    800w
```

**`sizes` must describe the real CSS slot, not the image.** Get this wrong and
the browser picks wrong in whichever direction the error points, which is worse
than no srcset at all — an over-wide `sizes` downloads too much everywhere. Each
clause has to be read off the stylesheet and match its breakpoint exactly. The
ones in use:

```
post lead image   (min-width: 900px) min(90vw, 1600px), calc(100vw - 3.5rem)
/blog/ card       (min-width: 721px) 22rem, calc(100vw - 3.5rem)
.reno-lg row      (min-width: 900px) min(90vw, 1600px), calc(100vw - 3.5rem)
.bleed / hero     100vw
.reno-plan plan   (min-width: 900px) calc(min(86vw, 1280px) - 22rem),
                  (min-width: 760px) 36rem, calc(100vw - 3.5rem)
```

`calc(100vw - 3.5rem)` is `.wrap`'s content box: 64rem max, 1.75rem of padding
each side. The 900px figures are the `--img-wide` breakout gate; the 720/721
and 760 figures are existing `max-width` breakpoints, so the srcset clause is
`min-width: 721px` against a `max-width: 720px` rule. **If you move a
breakpoint in style.css, these go stale silently** — nothing errors, the page
just picks a worse file.

`min()` inside `sizes` is fine; verified parsing in this browser against a
plain-`px` control. If a parser ever rejects the attribute it falls back to
`100vw`, which over-selects but still renders.

**The 1600w tier is not a mobile tier — it is what most desktops actually get.**
At DPR 1, a 1920 viewport renders the lead at 1600px and therefore picks 1600w,
not 2400w. Only DPR >= 1.5 reaches for 2400w. So the 1600w files are the ones
most desktop readers see, and they must be good: the three post heroes' 1600w
files are the exact bytes that shipped before the 2400 raise, restored from git
rather than re-encoded, so that tier is known-good.

**Caches do not downgrade.** Once a browser holds a larger candidate it will
keep using it even when `sizes` says a smaller one would do. That makes
selection impossible to test on a page whose big file is already cached — add a
cache-busting query string to each candidate when verifying, or the reading is
meaningless. This cost real time; do not re-learn it.

`blog/img/florida-subdivision-aerial.jpg` is the worked example: a nadir drone
shot of a subdivision, every pixel textured. Its size/quality curve is nearly
flat -- at 2400 wide, q34 gives 471KB and q24 still gives 338KB -- so there is
no setting that buys much back. It ships at **q=26 / 369KB**, and it is the
only image on the site that needed the extended ladder.

It still looks clean, because a post hero renders at **1600px** wide at a 1920
viewport and the mush is below what that resolution shows. Judge the output at
render size, not at 100%. (That 1600px figure is post-design-pass: a lead image
now breaks out to `--img-wide`. It used to render at 712px, and an older
version of this note said so -- if you find 712 quoted anywhere else, it is
stale.)

There is no split any more. `style.css` is the only stylesheet. Homepage-only
rules live at the bottom of it, every selector prefixed with `.home`, which is
set on `<body class="home">` in `index.html`. That prefix is what keeps
homepage layout from reaching the blog pages.

**Specificity gotcha, learned the hard way.** `.home .wrap` is two classes and
outranks `nav .wrap`, which is one element plus one class. An early version of
`.home .wrap` restated `padding:0 1.75rem`, which silently clobbered the
`padding-left:0` that the nav needs, and the mobile nav grew by 17px. When you
scope a rule with `.home`, override only the properties that actually differ —
here that is `max-width` and nothing else.

---

## What is in the repo but not on the web

The Worker is deployed with `--assets=.`, which serves the **entire repo root**.
That is why `HANDOFF.md` was live at `https://jessebattle.com/HANDOFF.md` for a
while — 27KB of internal notes, non-compete section and deploy config included,
crawlable, with no `Disallow` in `robots.txt`.

`.assetsignore` fixes that. Cloudflare Workers Assets reads it like a
`.gitignore`: anything matched is committed to git but never uploaded, so it is
in the repo and 404s on the web. Currently excluded:

```
tools/          build scripts, not site content
*.md            HANDOFF.md, HOW-TO-POST.md
.gitignore
```

**Verify it, do not trust it.** After changing `.assetsignore`, run
`wrangler dev` and curl the path — it must 404 — then curl `/`, `/blog/`,
`/style.css` and confirm they still 200. It is equally easy to exclude nothing
and to exclude the whole site.

`tools/headshot.py` lives here rather than in a gitignored folder on purpose.
The headshot recipe below existed only as prose, and rebuilding from prose
walked straight into two bugs that the prose did not mention. The script is the
part you run; the prose is the part that explains why. Keep both.

## Design system

```
--ink      #061019   page background, near-black navy
--ink-2    #0B1C28   raised panels and cards
--pb       #A1EBFF   accent, sampled from the Pinellas Builders logo
--pb-mid   #4FB0D4   line work
--paper    #EAF4FA   body text, cool white
--slate    #96ABB6   muted text (raised from #6F8A9B for AAA — see Contrast below)
--hair     rgba(161,235,255,.16)  borders
```

Type: Archivo (900 for display, 700 for subheads), Source Serif 4 for body,
JetBrains Mono for labels and data. All from Google Fonts.

### Type scale — do not hand-write font sizes

Every `font-size` on the site references one of thirteen custom properties.
There are **no literal font sizes anywhere**. This is deliberate: before the
scale existed there were 42 distinct sizes across four pages, the Writing page
title had drifted to within 9% of the hero name, and fifteen different sizes
were doing the same mono-label job.

Defined once in `:root` in `style.css`. Every page links that one file:

```
--d1  clamp(2.4rem,6.2vw,4.1rem)   38-66px   hero display line — one per page
--d2  clamp(1.75rem,3.6vw,2.15rem) 28-34px   page titles, closing headline
--d3  clamp(1.5rem,3vw,1.8rem)     24-29px   section heads, contact values
--h1  1.5rem    24px    article h2, hat h2
--h2  1.25rem   20px    feature card, post cards
--h3  1.05rem   16.8px  article h3, credential cards, wordmark
--lead     1.15rem   18.4px  hero kicker, page decks
--base     1.075rem  17.2px  body and article copy
--small    .95rem    15.2px  card copy, author box, timeline
--xsmall   .875rem   14px    source notes
--l1  .875rem   14px   eyebrows, nav link text, section labels, captions
--l2  .8125rem  13px   bylines, times, footer, renovation section labels
--l3  .75rem    12px   nav numerals, brand sub-label, badges, station labels
```

Rules that keep it coherent:

1. **One `--d1` per page, and only on a hero.** It is 1.9x `--d2` at desktop.
   The point of the rule is that nothing competes with the hero *inside a
   view*; it was written as "homepage only" when the homepage was the only
   page that had a hero. `/renovation` now has a full-bleed 80vh hero doing
   exactly the same job, and the two never appear together, so the constraint
   that matters is one per page. What is still banned is a body heading or a
   card title reaching `--d1`.
2. **Add a size only by adding a step**, never by writing a literal value in a
   rule. A one-off `font-size:1.42rem` is how the 42 sizes happened.
3. **`--l3` (0.75rem / 12px) is the floor. Do not go below it.** This is not a
   taste call. Before the scale existed, nav numerals and the brand sub-label
   sat at 8.6px and the label tier had drifted to fifteen different sizes
   between 8.6 and 12.5px.

   The floor sat at 9.6px until 2026-09, and the reasoning recorded here for
   it was wrong in an instructive way. It said, correctly, that letterspaced
   uppercase mono is hard to read at that size for anyone and that this
   audience skews older — a REALTOR's clients are frequently over 55 — and
   then set the floor at 9.6px anyway. Those are arguments *against* the
   number they were used to defend. Having the smallest text on the site be
   the hardest typographic case, aimed at the readers least able to resolve
   it, is not a floor that holds up.

   Contrast was doing the arguing that size should have done: the note used to
   add that 9.6px was "the case that has to clear 7:1". Contrast ratio does
   not depend on size at all, so clearing 7:1 said nothing about whether the
   text could be read. The tier is now 14 / 13 / 12px, nothing on the site is
   below 12px, and the worst-case ratio is unchanged at 7.03:1 because none of
   the colours moved. Both things have to hold, and they are independent.
4. Every page — homepage included — links `style.css`. The small inline
   `<style>` blocks that remain on the article pages hold only article-specific
   layout (hero figure, key-take box, the ROAD Act post's schedule graphic) and
   reference the same variable names.

Visual language is cyanotype/blueprint. Elevation contours draw in behind the
hero, faint grid overlay, technical labels in mono. It came out of the logo
colour, and it fits a builder with a planning degree.

---

### Byline — the credential is conditional, the author box is not

The default article byline is name, role, date, and nothing else:

```html
<p class="byline">
  <strong>Jesse Battle IV</strong>
  <span class="role">REALTOR, Team Kym Coyle</span>
  <time datetime="2026-08-19">August 19, 2026</time>
</p>
```

On a **construction-adjacent** post, and only there, add the credential between
the role and the date:

```html
  <span class="cred">Certified General Contractor</span>
```

**Why.** A byline credential is a claim that this specific credential is why
you should trust this specific article. On the condo deadlines post that is
true — reading a milestone inspection report is the whole reason the piece
exists. On the ROAD to Housing Act post it is not: that is a federal policy
and inventory story, and a GC licence adds nothing to it. A credential
asserted where it does not apply reads as padding and quietly devalues the
places it is load-bearing.

**The test:** would a reader trust *this article* more for knowing he holds a
GC licence? Yes, include it. No, leave it off.

Where it stands:

```
2026-st-pete-condo-deadlines              CGC in byline
2026-kitchen-bath-trends-st-pete          CGC in byline
2026-institutional-investor-ban-tampa-bay default byline
```

**Nothing is lost by leaving it off.** Two things carry the full credential
stack on every post regardless:

- The **author box** at the foot of the article — fourth-generation native,
  CGC since 2003, FSU planning degree, thirty years in construction. A reader
  who wants the whole picture still gets it.
- The **JSON-LD** `author.jobTitle`, which stays `"REALTOR and Certified
  General Contractor"` on every post. That is machine metadata, where more
  signal is strictly better and there is no cost to a reader.

This is only about the visible byline.

**Styling note.** `.byline .cred` is the only `--pb` element in the byline;
everything else inherits `--slate`. So the accent appears exactly when the
credential is relevant, which is the point. `.role` deliberately has no rule
of its own — it inherits, and adding an empty rule for it would be dead CSS.

**No licence number in the byline.** With the role added, the full string
`Certified General Contractor CGC1506583` pushed the line 39px past the
article column, which was 712px at the time (the design pass has since widened
it; the measurement is kept here only because it is why the number was dropped) and orphaned the date on a second row. The number is dropped
here rather than the phrase, because a bare `CGC1506583` means nothing to a
reader — and the number is already on screen twice regardless: the nav
sub-label reads `REALTOR · CGC1506583` on every page, and the author box gives
the full `licensed since 2003 (CGC1506583)`. Nothing is lost and the byline
stays on one line. If the byline ever gains a fifth item, it will wrap again —
check it at 1280px before publishing.

### Share row — the only JavaScript on the site

Every article carries a share block between the source note and the author
box. It is the one place the site runs script, and it is deliberately small:
`share.js` is about 2KB, loads `defer` from the root on every post, and makes
no network calls. No third-party widgets, no SDKs, no trackers — the four
social buttons are plain `<a href>` links to each platform's own share
endpoint, so they work with the file blocked.

Only two things need script, and both **ship hidden and are revealed by JS**,
so nobody is ever shown a control that cannot work:

- **Copy link** — unhidden only where `navigator.clipboard` exists. Copies the
  page's `<link rel="canonical">`, not `location.href`, so the copied address
  never carries a `#fragment`, a `?query`, or the redirecting `.html` form.
  Falls back to a `execCommand` textarea, then to a "Copy failed" label.
- **The phone share sheet** — gated on `navigator.share` **and**
  `(pointer: coarse)`. Desktop Safari and Edge also expose `navigator.share`,
  and collapsing five visible options into one button there is a downgrade.
  When it does apply, the button row is hidden and the sheet replaces it.

**The `hidden` attribute needs help here.** `[hidden]{display:none}` comes
from the UA stylesheet, and *any* author `display` beats it — so
`.share-btn{display:inline-flex}` rendered the hidden buttons anyway, and the
bug is invisible in the DOM (the property really is `hidden === true`). The
fix is `.share-btn[hidden],.share-row[hidden]{display:none}`: class plus
attribute outranks the bare class, so no `!important`. Watch for this on any
future component that sets `display` and toggles `hidden`.

**Colour.** The row is the social cards inverted — restrained at rest
(`--slate` on `--ink`), brand colour on hover. It reuses the same `--lit`
tokens, so `.s-x` styles both a footer card and a share button. Note the
cascade order: the `--lit` tokens are declared *before* `.share-btn`, so a
default `--lit` on `.share-btn` would have silently beaten every brand value
at equal specificity. The default is written as `var(--lit,var(--pb))` at the
point of use instead.

### Preview cards — 1.91:1, and never reuse a page image

Every page carries `og:image` plus the matching `twitter:*` set. The og tags
cover Facebook, LinkedIn, iMessage and Slack; X reads only `twitter:*` and
ignores og entirely, so both sets exist and must agree. `twitter:card` is
`summary_large_image` everywhere.

```
/                     social-home.jpg      1200x630   q92,  71KB
/blog/                social-writing.jpg   1200x630   q88, 193KB
each blog post        its own hero         2400x1350
```

The post heroes are 2400x1350 as of 2026-09-18, except `quartzite-kitchen`,
which is still 1600x900 because its source is gone (see blog/img/CROPS.md).
Both sizes are 16:9, not 1.91:1, so they are cropped by the platforms rather
than letterboxed -- that is the long-standing tradeoff noted below, and the
size change does not affect it.

**Every URL must be absolute** — `https://jessebattle.com/...`. A relative
path renders a card with a blank space where the picture should be, and the
file looks perfectly fine in the editor.

### The Pinellas map's labels, and what it does NOT cover

`blog/img/pinellas-peninsula-satellite.jpg` carries an inline SVG label layer
in `blog/index.html`, not text burned into the JPG. The SVG's viewBox is the
image's own 900x900 pixel grid, so **a label's x/y ARE its pixel coordinates on
the satellite** — place by eye against the photograph and paste the numbers
straight in. Type sizes are in user units, so they scale with the container
(968px at content width, a 1.076 scale). The halo is `paint-order:stroke`
against `--ink` rather than a box, which is what survives the crossing from
bright Gulf water to dark land. Tiers: `.mj` major, `.mn` minor, `.wt` water.

**The image does not reach Tarpon Springs or Palm Harbor, and re-cropping
cannot fix that.** The top edge is about 28.06N. Tarpon Springs is at 28.146N,
roughly 10km beyond it; Palm Harbor at 28.078N sits just past it. The square
crop is not the cause — mask-matching the derivative against
`Site photos/pinellas co map.jpg` puts the crop at essentially the full source
height (side ~1728-1744 out of 1758, y-offset ~0-16), so the source stops at
the same latitude. Only a new, taller source image would bring them in. Do not
re-run this investigation; the south end is fine, reaching past Tierra Verde
and Fort De Soto to about 27.54N.

Scale, if you ever need to convert: roughly 0.00057 degrees of latitude per
pixel, calibrated on the Courtney Campbell causeway (y~150) and the Gandy
bridge (y~308), and cross-checked against the southern tip of the mainland at
Pinellas Point (predicted y=638, measured ~655).

**Preview cards are 1.91:1 landscape. Most of the site's images are not.**
Check the crop before reusing a file; the platforms centre-crop without asking:

```
headshot.jpg    605x757 portrait -> 1.91:1 discards 58% of the height
                (crops to the shirt, cutting off the top of the head)
pinellas map    900x900 square   -> 1.91:1 discards 48% of the height
                (cuts the top and bottom off a peninsula that runs vertically)
```

Both would have shipped a broken-looking card. The fix in both cases was to go
back to the **full-resolution original** in `Site photos/`, which is landscape
in both cases — `Headshot1.JPG` is 2580x1882 and `pinellas co map.jpg` is
3600x1758 — and cut a purpose-made 1.91:1 frame from it. Compose on the
subject, not on the frame: the headshot card is centred on the face rather
than the image centre, and the map card drops roughly a third of the empty
Gulf so the peninsula is not stranded on the right.

**Judge it at feed size.** Downscale the finished card to about 500px wide and
look at it — that is roughly how it renders in a timeline, and it is the size
at which a bad crop or a too-small subject becomes obvious.

The headshot card is a plain crop of the studio original on its grey backdrop,
**not** the ink-navy composite used on the homepage. Do not try to run the
background key for this: the recipe below depends on chroma separation between
backdrop and clothing, and a grey backdrop with a light blue shirt is exactly
the case it is documented to fail on.

## Contrast — measure against the real background, not the token

Every muted colour on the site clears **7:1 (WCAG AAA)**. Keeping it that way
depends on measuring correctly, and the obvious method gives the wrong answer.

**The trap.** Checking a colour against the `--ink` token reports `--slate` at
7.02:1 and everything looks fine. But text does not always sit on `--ink`. On
the raised `--ink-2` panels (cards, the author box, key-take boxes, the hats
strip) and on the nav's active cell — which is `--ink` plus a 7% cyan tint,
computing to `rgb(17,31,41)` — the same colour measured **6.13–6.35:1**. A
token-only check would have reported a pass while the smallest labels on the
site sat short of AAA.

**The method.** For each text element, walk up the DOM compositing every
background layer until you hit an opaque one, composite the text colour (with
its own alpha) over that result, and only then compute the ratio. Do it in the
browser against the rendered page, not by hand from the palette.

**Where it stands.** `--slate` is `#96ABB6`, chosen to clear 7:1 against the
*lightest* background in use, not against `--ink`:

```
on --ink        (6,16,25)    8.03:1
on --ink-2      (11,28,40)   7.26:1
on nav active   (17,31,41)   7.03:1
on social card  (17,31,42)   7.02:1
```

Across the three page types that is 0 of 306 text nodes below 7:1, worst case
7.03:1, the nav numerals on the active cell. Re-measured 2026-09-17 after the
label tier was raised: the ratios are unchanged because no colour moved, but
that worst case is now 12px rather than 9.6px.

Photo captions are the one exception to `--slate`. They are
`rgba(234,244,250,.74)`, which composites to `rgb(175,185,192)` and measures
9.60:1 on `--ink` — lifted off `--slate` deliberately, because at caption size
the old colour compounded the size problem. They are still a clear step below
body text, which runs `rgba(234,244,250,.86)` at 12.73:1. One rule in
`style.css` defines every caption on the site; the per-page rules set only
spacing and alignment, so a caption reads the same on `/`, `/blog/…` and
`/renovation`.

**When to re-run it.** Any time you add a component with a background lighter
than `--ink-2`, or raise the opacity of a tint over a panel. A lighter panel
lowers every ratio on it, and the failure is invisible — the colour token has
not changed, so nothing looks wrong in the CSS. Map labels sit over photography
and cannot be measured this way; they rely on a text-shadow instead.

## Headshot recipe, and how it fails

`headshot.jpg` is 605x757, baseline JPEG, about 52KB, background removed and
composited onto the ink navy. To reproduce it from a new shot:

1. 4:5 crop centred on the face, full frame height where possible
2. Key the background out (see below) as a **soft** matte — fractional alpha at
   the edge, not a binary cutout. Step 3 cannot work without it
3. **Decontaminate the edge colour** (see below), then composite onto `#061019`
4. Grade the **subject only**, so the ground stays exactly the site ink:
   saturation 78%, contrast x1.06, red x0.97, blue x1.06
5. Fade the lower half into the background with a **smoothstep** ramp, starting
   at 52% of image height and reaching full background at the bottom edge:

   ```
   t = (y - start) / (end - start), clamped 0-1
   alpha = 1 - (t * t * (3 - 2*t))
   ```

   **Use smoothstep, not a linear or power ramp.** The first version of this
   faded the bottom 22% with `(1-t)^1.6`. That curve has a slope of -1.6 at its
   start, so alpha begins dropping the instant the fade begins, and the eye
   reads that as a hard horizontal band across the shirt. Smoothstep has zero
   derivative at both ends, so there is no onset to see — the ramp loses only
   three alpha levels over the first 5% of its run. Starting earlier and
   running roughly 2.3x longer also spreads the transition over enough distance
   that it stops being detectable.
6. Resize to 605x757, baseline JPEG, quality tuned to land near 55KB

**Colour decontamination — do not skip this.** A pixel at the edge of the hair
is part hair and part backdrop: `C = alpha*F + (1-alpha)*B`. Keying alone sets
the alpha but leaves `C` as the measured, contaminated colour, so the pale
studio grey stays baked into every semi-transparent pixel. Composited onto the
near-black ink, that reads as a white halo tracing the hair and shoulders. It
is invisible at page size and obvious at 5x.

Recover the true foreground colour before compositing:

```
F = (C - (1 - alpha) * B) / alpha        for 0.05 < alpha < 0.999
```

`B` is the sampled backdrop — take the median of the deep background (erode
`s > 0.95` a few px so no edge pixels contaminate the sample). Here it is
`(191, 190, 186)`. Clamp the result to 0-255, and leave pixels below
alpha 0.05 alone: the division explodes as alpha approaches zero.

**Measure it, do not eyeball it.** Average a luminance profile inward from the
first lit pixel across the crown, and compare the peak to the hair interior
20 px in. That overshoot is the halo:

```
shipped, before this fix          +19.7 luma
rebuilt, better matte only         +9.8
rebuilt + decontamination          +4.9
```

Anything under about +5 is genuine rim light from the key light and should
stay. Driving it to zero would look like a cutout.

**Three things that bite when you rebuild this:**

- **Keep the luma ramp narrow.** The matte here scores a pixel as backdrop-like
  from low chroma plus high luma, ramping over luma 60-110. Widening that
  toward the true backdrop luma of 191 looks more principled and is worse: it
  hands fractional alpha to bright but fully *opaque* skin and hair, so
  decontamination subtracts backdrop from pixels that never had any and the
  overshoot goes from +11 back up to +24. Fractional-alpha pixels should be
  about 1% of the frame. At 7% it is already wrong.
- **Open the candidate set before deciding connectivity.** The specular
  highlight along the collar fold is neutral (chroma ~12) and bright, so the
  flood fill walks in from the backdrop along a 1 px line and cuts the collar
  off. A 2-iteration binary opening before labelling kills the tendril. Gate
  only *connectivity* with it — the alpha itself must still come from the soft
  score, or you lose the fractional edge.
- **Check the framing against the existing file.** Head-centroid detection is
  approximate; a rebuild landed 8 px off, which is invisible alone but means a
  "halo fix" also silently reframes the portrait. Cross-correlate the new file
  against the old over the face and nudge the crop until the offset is zero, so
  the only thing that changed is the edge.

**Check the fade, do not assume it.** Scan the output's vertical luminance
profile for abrupt row-to-row steps; any jump inside the fade region means the
curve is wrong. Then open the file and actually look at it.

**The background key is the fragile part.** It works by finding pixels that are
near-neutral and bright, then flood-filling inward from the frame border so
only background *connected to the edge* is removed. That protects grey hair and
skin highlights in the interior. It depends entirely on **chroma separation**
between the backdrop and the clothing:

```
this shot: backdrop chroma 5-8   shirt chroma 26-46   -> wide margin, clean key
           backdrop luma 94-185  hair luma 36-70      -> luma test excludes hair
```

**How it breaks.** A blue backdrop, or a grey/white shirt, collapses that
margin — the garment becomes as neutral as the background and the key eats the
subject. This actually happened on the first attempt here with a
similarity-based flood fill: it leaked into the shadowed side of the shirt and
chewed it to ribbons. Always composite the mask over magenta and *look at it*
before compositing for real.

**So for future shoots:** neutral grey or white backdrop, subject in a coloured
shirt. That keeps chroma separation wide and the recipe working. Also prefer
the higher-resolution file — a 4:5 crop needs roughly 1500px of width to
downsample cleanly to 605.

**Never retouch faces.** Crop, background key, colour grade and fade only. No
warping, liquify, or eye correction — automated eye correction was tried
previously and looked terrible.

## How much to verify

Jesse set this on 2026-08-19. Default to the light path; the heavy path is for
the work where looking has actually caught bugs.

**Light — just make the change.** Copy edits, content changes, small fixes.
Confirm nothing broke structurally (pages still return 200, HTML still parses,
no console errors) and push. No screenshots, no contrast audit.

**Full — screenshots and the composited-background contrast audit.**
- new components
- layout changes
- anything touching the type scale or the colour system
- image processing

That list is not arbitrary. Every one of these caught something real: a
`hidden` attribute defeated by `display:inline-flex` that the DOM reported as
correctly hidden, a `--lit` default that silently beat every brand colour at
equal specificity, a media query that lost to a two-class selector, and two
preview-card crops that would have shipped with the subject's head cut off.

**If a task does not clearly fall in one bucket, ask rather than guessing.**

## Known issues / next steps

**Unfinished**
- Credential cards have no icons. Several attempts at a tomahawk and a helmet
  failed to read at 48px. Cards work fine without them, but if you want icons,
  do it in Claude Code where you can see the render immediately.
- ~~jessebattle.com not attached to the Worker.~~ Done. apex, www, and
  jessebattle.jessefsu.workers.dev all serve the same pages.
- ~~www.jessebattle.com returned a 522.~~ Fixed by deleting the blocking www
  CNAME in Cloudflare DNS and attaching www.jessebattle.com to the Worker as a
  second custom domain. Verified: both apex and www return 200 with zero
  redirects and byte-identical content.
- pinellasbuilders.com should 301 forward to jessebattle.com. Do it in GoDaddy
  DNS -> Forwarding. Delete any existing A/CNAME on the root first or the
  forward silently fails.
- ~~Sitemap not submitted to Google Search Console.~~ Done. Domain property
  verified by Cloudflare DNS TXT record, sitemap submitted, and all four URLs
  submitted for indexing.

  **Gotcha worth remembering:** on a Domain property, Search Console requires
  the FULL sitemap URL — `https://jessebattle.com/sitemap.xml`. Entering the
  relative `sitemap.xml` is rejected as invalid. (URL-prefix properties accept
  the relative form, which is why most instructions online show it.)

**Layout conventions worth keeping**
- **Datum rules**: at most two or three per page. One under the nav, one
  opening a major section. They are structure, not decoration — a page full of
  them means none of them read as a baseline.
- **Social cards**: the grid is six columns with the cards spanning it so five
  cards fill two complete rows (three, then two) with no orphan. If you add or
  remove a card, re-check `.social-grid .slink:nth-last-child(-n+2)`.

**Worth doing**
- Second blog post. The FEMA 50% rule deserves its own piece; it is currently
  buried inside the trends article and it is the most searchable thing here.
- Real Google review quotes on the page rather than just a link out
- Photos of St. Pete: waterfront, Shore Acres, seawalls

---

## Deploy config, in case a build fails

Cloudflare build settings for this project:

```
Build command:   (empty)
Deploy command:  npx wrangler deploy --name=jessebattle --assets=. --compatibility-date=2026-08-15
Root directory:  /
```

The `--compatibility-date` flag is required. Without it wrangler errors with
"A compatibility_date is required when uploading a Worker" and the build fails.
There is no `wrangler.jsonc` in the repo; the flags carry the whole config.
Adding a proper `wrangler.jsonc` would be cleaner if you want to tidy this up.

---

## Non-compete constraint (important)

Jesse's franchise termination with Renovation Sells is effective January 1, 2026.
The non-compete under Section 19.5 of the franchise agreement runs to roughly
**January 1, 2028**.

Until then this site must not market renovation or remodeling services. That
means no services list, no project portfolio, no "request a quote", no pricing,
no "now booking". Kitchen and bath remodeling is the exact centre of what
Renovation Sells does.

What is fine, and what the site currently does:
- Stating the CGC license and that he owns Pinellas Builders. Factual identity.
- Writing about renovation trends as market commentary from a REALTOR's angle.
- Construction expertise framed as why he reads houses well for buyers.

The existing blog post was deliberately rewritten to remove first-person
contractor voice ("a homeowner calls us", "we use sheet membrane"), a
"Working With Pinellas Builders" section, and a consultation CTA. Keep new
content on the same side of that line.

---

## AI discoverability, already in place

- `robots.txt` explicitly allows GPTBot, OAI-SearchBot, ClaudeBot,
  Claude-SearchBot, PerplexityBot, Google-Extended, and the rest. Note that
  OAI-SearchBot and GPTBot are separate agents and both are named.
- `llms.txt` gives agents a plain-language summary plus a profile list
- Social links carry `rel="me"` and visible text labels, not bare icons.
  Icon-only links give crawlers nothing to read.

### Structured data

Every indexable page carries one `@graph` rather than a standalone node, with
entities defined once and referenced by `@id`:

```
Person             #jesse             titles, DBPR credential, address,
                                      phone, email, sameAs, knowsAbout
RealEstateAgent    #practice          Team Kym Coyle at Charles Rutenberg
GeneralContractor  #pinellasbuilders  name, address, areaServed, founder
WebSite            #website
Blog               #blog              lists the four posts
BlogPosting        one per article, with mainEntityOfPage and isPartOf
ImageGallery       /renovation, with nine ImageObjects
BreadcrumbList     every page
```

**Carry every node a page references.** The first validation run reported an
untyped `CreativeWork` nobody wrote. It was `#website`: `/renovation` pointed
at it with `isPartOf`, but only the homepage defined it, so the reference
dangled and the validator materialised a stub. Blog posts had the same problem
with `#blog`. A cross-page `@id` is not resolved by crawlers for you — if a
page references a node, that page has to define it.

**`mainEntityOfPage` is the exception that looks like the bug.** It is a typed
`{"@type":"WebPage","@id":...}` pointer with no other properties, which is the
correct idiom. The difference from the bug above is the explicit `@type`.

**Validating.** Google's Rich Results Test needs a signed-in account — both the
URL tab and the Code tab return *"Something went wrong. Log in and try again"*
otherwise. Do not spend time automating its editor. Use the Schema.org
validator API, which is public and takes a live URL:

```
curl -s https://validator.schema.org/validate \
  --data-urlencode "url=https://jessebattle.com/renovation" | sed "s/^)]}'//"
```

Read `totalNumErrors` / `totalNumWarnings`, and walk `tripleGroups[].nodes[]`
through `types[].value` and `nodeProperties[].target` to see what actually
parsed. **Zero errors alone proves nothing** — a page with no markup at all
also scores zero. Check that the types you expect are in the parsed list. It
rate-limits and starts answering 302 after a dozen or so calls; back off.

`Thing` and `Country` show up in results without being in the markup. That is
the validator reporting the type hierarchy (City is an AdministrativeArea is a
Place is a Thing) and the range of `addressCountry`. Not a defect.

Last run, 2026-09-18, all seven indexable pages: **0 errors, 0 warnings**, 19
distinct types parsed.

**What must never go in.** No `Service`, `Offer`, `OfferCatalog`, `Review`,
`Rating` or `AggregateRating` types anywhere — see the non-compete section
above. The GeneralContractor node is descriptive entity data only: it names the
business and where it is, and says nothing about work offered or priced.
`areaServed` lists only places actually named on the site.

When adding a post, mirror the `@graph` from an existing article and update
headline, description, dates, url and the breadcrumb's last item.
