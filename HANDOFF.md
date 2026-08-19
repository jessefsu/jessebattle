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
index.html                             homepage, all CSS is inline in <style>
style.css                              shared styles for the blog pages only
robots.txt                             crawler rules, allows everything
sitemap.xml                            add a <url> block per new post
.gitignore                             keeps .DS_Store and editor junk out of
                                       the repo (everything in the repo root
                                       is served publicly, so this matters)
llms.txt                               plain-language summary for AI agents
headshot.jpg                           hero portrait, pre-processed
pb-logo.png                            Pinellas Builders mark
pelican.png                            real estate badge, original colours
blog/index.html                        the Writing index
blog/2026-kitchen-bath-trends-st-pete.html
blog/img/quartzite-kitchen.jpg
HOW-TO-POST.md                         non-technical posting instructions
```

**Photos.** Full-resolution originals live in `Site photos/`, which is
git-ignored on purpose. Only processed derivatives in `blog/img/` are
committed. That matters because the Worker serves the repo root, so anything
committed is publicly downloadable at full size. Process to the house spec
before committing: 1600x900 for a hero, progressive JPEG, roughly 150-200KB.
Keep the original in `Site photos/` so a photo can be re-cropped later without
re-shooting it.

Note the split: `index.html` carries its own styles inline. The blog pages
share `style.css`. That was an artifact of how this got built. Worth
consolidating into one stylesheet at some point.

---

## Design system

```
--ink      #061019   page background, near-black navy
--ink-2    #0B1C28   raised panels and cards
--pb       #A1EBFF   accent, sampled from the Pinellas Builders logo
--pb-mid   #4FB0D4   line work
--paper    #EAF4FA   body text, cool white
--slate    #6F8A9B   muted text
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

Defined in `:root` in both `style.css` and the inline `<style>` in
`index.html` (keep the two in sync until the inline CSS is consolidated):

```
--d1  clamp(2.9rem,8vw,5.25rem)    46-84px   hero name — HOMEPAGE ONLY
--d2  clamp(2.1rem,5.4vw,3.5rem)   34-56px   page titles, closing headline
--d3  clamp(1.65rem,3.6vw,2.35rem) 26-38px   section heads, contact values
--h1  1.55rem   25px   article h2, hat h2
--h2  1.3rem    21px   feature card, post cards
--h3  1.1rem    18px   article h3, credential cards, wordmark
--lead     1.2rem    19px   hero kicker, page decks
--base     1.075rem  17px   body and article copy
--small    .95rem    15px   card copy, author box, timeline
--xsmall   .875rem   14px   source notes
--l1  .74rem  12px   eyebrows, nav link text, section labels
--l2  .66rem  11px   bylines, times, datum labels, footer, captions
--l3  .6rem   10px   nav numerals, brand sub-label, badges, station labels
```

Rules that keep it coherent:

1. **`--d1` is the hero name and nothing else.** It is 1.5x `--d2` at desktop.
   If anything else reaches that size the homepage stops having a focal point.
2. **Add a size only by adding a step**, never by writing a literal value in a
   rule. A one-off `font-size:1.42rem` is how the 42 sizes happened.
3. **`--l3` is the floor.** Do not go below it. Letterspaced uppercase mono
   under about 9px is unreadable, and this audience skews older.
4. Article pages inherit the variables from `style.css`; their inline `<style>`
   blocks reference the same names.

Visual language is cyanotype/blueprint. Elevation contours draw in behind the
hero, faint grid overlay, technical labels in mono. It came out of the logo
colour, and it fits a builder with a planning degree.

---

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
- Consolidate the inline homepage CSS into style.css. The type scale and the
  nav now exist in both files and have to be edited twice.
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
- JSON-LD on every page: Person schema with the DBPR credential, worksFor the
  brokerage, sameAs linking all four social profiles
- Social links carry `rel="me"` and visible text labels, not bare icons.
  Icon-only links give crawlers nothing to read.

When adding a post, mirror the JSON-LD block from the existing article and
update headline, description, dates, and url.
