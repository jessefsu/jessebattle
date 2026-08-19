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

### Step 6. Re-upload

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
