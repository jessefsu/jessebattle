# Handoff notes: jessebattle.com

Everything you need to pick this up in Claude Code.

---

## What this is

A static personal site for Jesse Battle IV. Plain HTML and CSS, no framework,
no build step. Every file is hand-editable.

**Repo:** github.com/jessefsu/jessebattle
**Host:** Cloudflare Workers, project name `jessebattle`
**Live now:** https://jessebattle.jessefsu.workers.dev
**Real domain:** https://jessebattle.com (live and serving as of 2026-08-18)

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

Visual language is cyanotype/blueprint. Elevation contours draw in behind the
hero, faint grid overlay, technical labels in mono. It came out of the logo
colour, and it fits a builder with a planning degree.

---

## Known issues / next steps

**Unfinished**
- Credential cards have no icons. Several attempts at a tomahawk and a helmet
  failed to read at 48px. Cards work fine without them, but if you want icons,
  do it in Claude Code where you can see the render immediately.
- ~~jessebattle.com not attached to the Worker.~~ Done — the domain resolves
  through Cloudflare and serves the site. Both jessebattle.com and the
  jessebattle.jessefsu.workers.dev address now return the same pages.
- pinellasbuilders.com should 301 forward to jessebattle.com. Do it in GoDaddy
  DNS -> Forwarding. Delete any existing A/CNAME on the root first or the
  forward silently fails.
- Sitemap has not been submitted to Google Search Console. Highest-value
  remaining SEO task by a wide margin.

**Worth doing**
- Consolidate the inline homepage CSS into style.css
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
