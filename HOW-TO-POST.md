# How to run this site

Everything is plain files. No database, no login, no monthly fee.

---

## PART 1: One-time setup

### Step 1. Put your real info in

Open each file below in Notepad (Windows) or TextEdit (Mac). Use Find and Replace.

Replace **`YOURDOMAIN.com`** with your real domain in these files:
- `robots.txt`
- `sitemap.xml`
- `llms.txt`
- `index.html`
- `blog/index.html`
- `blog/example-post.html`

Replace **`YOUR@EMAIL.com`** with your real email in:
- `index.html`
- `llms.txt`

Replace **`(727) 555-0100`** and **`+17275550100`** with your real phone in:
- `index.html`

### Step 2. Pick your pelican

The site currently uses `pelican.png` (blue version). To use the original
orange and green version instead, delete `pelican.png` and rename
`pelican_orig.png` to `pelican.png`.

### Step 3. Upload everything

Go to dash.cloudflare.com, then Workers & Pages, then Create, then Pages,
then Upload assets. Drag the whole folder in. Deploy.

Then Custom domains, and attach your real domain.

### Step 4. Tell Google it exists

1. Go to search.google.com/search-console
2. Add your domain as a property, follow the verification steps
3. Click Sitemaps in the left menu
4. Type `sitemap.xml` and click Submit

This is the single highest-value thing you can do for search visibility.
Do not skip it.

---

## PART 2: Publishing a new post

Do this every time. Takes about five minutes.

### Step 1. Copy the template

Make a copy of `blog/example-post.html`. Rename it with words from your
title, all lowercase, hyphens instead of spaces, ending in `.html`.

Good: `shore-acres-flood-mitigation-2026.html`
Bad: `Post 3 FINAL (2).html`

That filename becomes part of the web address, so put real words in it.

### Step 2. Change the six marked spots

Open your new file. Search for `CHANGE THESE 6 THINGS`. Everything you
need to edit is numbered and commented:

1. Title
2. Description (one sentence, this is what shows up in Google)
3. The page address (3 places, all on adjacent lines)
4. Structured data (headline, description, dates, url)
5. The headline on the page
6. The date (2 places on the same line: `datetime="2026-08-18"` is the
   computer-readable one, `August 18, 2026` is what people see)

### Step 3. Write the post

Between `YOUR POST STARTS HERE` and `YOUR POST ENDS HERE`.

Every paragraph goes inside `<p>` and `</p>` tags. Section headings go
inside `<h2>` and `</h2>`. That is genuinely all the HTML you need.

### Step 4. Add it to the blog index

Open `blog/index.html`. Find the block marked `COPY ONE OF THESE BLOCKS`.
Copy the whole `<li>` through `</li>` chunk, paste it directly above the
existing one, and change the link, date, headline, and summary.

Newest post goes on top.

### Step 5. Add it to the sitemap

Open `sitemap.xml`. Copy the example `<url>` block, paste it, change the
address and the date.

### Step 6. Check the share block and the preview tags

Both of these come along when you copy the template, so this step is mostly
checking that three values got updated. Every new post needs them.

**The share block** sits between the source note and the author box. Five
buttons: copy link, X, Facebook, LinkedIn, email. The four social ones are
plain links with the post address baked into them, so **the address appears
inside each `href` and has to be changed**. Search your new file for the old
post's name; if it still appears anywhere in the share block, those buttons
will share the wrong article.

Copy link and the phone share sheet are handled by `/share.js`, which every
post loads with this line just before `</body>`:

```html
<script src="/share.js" defer></script>
```

That file reads the post's own canonical address, so it needs no editing. If
you delete that line, the four social buttons still work — you just lose copy
link.

**The preview tags** control what shows up when the post is shared. There are
two sets and they must agree:

- `og:*` covers Facebook, LinkedIn, iMessage and Slack
- `twitter:*` covers X, which ignores the og tags entirely

Set `twitter:title`, `twitter:description` and `twitter:image` to the same
values as their `og:` counterparts, and leave `twitter:card` as
`summary_large_image`. If you skip the twitter tags, the post still shares on
X — as a bare link with no picture.

**Image addresses must be full addresses.** Every `og:image` and
`twitter:image` starts with `https://jessebattle.com/`. A short path like
`img/photo.jpg` looks fine in the file and produces a preview card with a
blank space where the photo should be.

**You do not need the Facebook Sharing Debugger for a new post.** Facebook
crawls a URL it has never seen the first time somebody shares it, so a brand
new post picks up its preview card on its own.

The debugger is only for **fixing a card that is already wrong**. If you
change the `og:image`, title, or description on a post that has already been
shared, Facebook keeps serving the old version from its cache, and the only
way to clear it is to paste the address into
[developers.facebook.com/tools/debug](https://developers.facebook.com/tools/debug)
and click Scrape Again.

So the rule of thumb is: **finish the post before you share it.** Get the
picture and the wording the way you want them, then post the link. That way
you never need the debugger at all.

### Step 7. Update the homepage strip

The homepage shows the **four most recent posts**. When you publish a fifth,
the oldest one drops off. This is the only step that involves deleting
something, so do it in this order.

Open `index.html` and find the comment:

```
<!-- ===== FOUR MOST RECENT POSTS, NEWEST FIRST. See HOW-TO-POST.md ===== -->
```

Below it are four `<li>` blocks. Then:

1. **Delete the last `<li>` block**, the one just above `<!-- ===== END POST
   STRIP ===== -->`. That is the oldest post. It is not gone from the site —
   it still lives on the Writing page and in the sitemap. It just stops
   showing on the homepage.
2. **Copy the first `<li>` block** and paste the copy directly above itself,
   so the new post is on top.
3. In your new top block change the link, the image filename, the alt text,
   both dates, the headline, and the excerpt.
4. **Move the Latest badge.** This line lives in the top card only:

   ```
   <span class="badge">Latest</span>
   ```

   Add it to your new card and delete it from the one below. Two badges is
   the easiest mistake to make here, so check that only one remains.

**The excerpt has to fit one line.** Aim for 12 to 16 words. These cards are
built to be scanned in a couple of seconds, and a long excerpt is what breaks
that. Write a new short one; do not paste the summary from the Writing page.

**Make the thumbnail.** The homepage does not load the full-size hero, it
loads a small crop of it. In Claude Code, ask for:

> Make a homepage thumbnail from `blog/img/YOUR-HERO.jpg` — 480x384, centre
> crop, progressive JPEG, under 28KB, save to `blog/img/thumb-YOUR-NAME.jpg`

All four thumbnails together are about 106KB, which is half what the single
large image used to cost. Keep it that way: if a thumbnail comes out much over
28KB, it needs a lower JPEG quality, not a smaller size.

### Step 8. Re-upload

Cloudflare Pages, your project, Upload assets, drag the folder in again.
Live in under a minute.

---

## What makes a post get found

Short version, in priority order:

1. **Answer a real question somebody types.** "Does Shore Acres flood
   insurance cost more in 2026" beats "Market Update."
2. **Be specific.** Neighborhood names, dollar figures, dates, street
   names. Specificity is what gets a page quoted in an AI answer instead
   of skipped.
3. **Put the takeaway in the first three paragraphs.** Both Google and AI
   assistants weight the opening heavily, and readers decide there. State the
   conclusion up front; everything after it is for the reader who wants the
   detail.
4. **Target 1,200 to 1,500 words.** Long enough to be the real answer, short
   enough that people finish it. If a section is context rather than
   consequence, cut it. If you are explaining the same thing twice at two
   different depths, keep the shallower one.
5. **Publish consistently.** Two posts a month beats twelve in January
   and nothing after.
6. **Write things only you can write.** Four generations in St. Pete, a
   GC license, and a planning degree is a combination almost nobody else
   in this market has. Lean on it.

---

## What is already handled for you

- `robots.txt` invites every major search and AI crawler in, including
  Google, Bing, ChatGPT, Claude, and Perplexity
- `llms.txt` gives AI assistants a plain-language summary of who you are
  and what you know
- `sitemap.xml` tells search engines every page on the site
- Structured data on every page tells machines you are a real licensed
  person at a real brokerage with a real credential
- Every page has its own title, description, and social preview
