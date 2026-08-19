/* Article share row. No third parties, no trackers, no network calls.
   The four social links are plain hrefs and work with this file blocked;
   this only adds the two things that need scripting.
   See HANDOFF.md and HOW-TO-POST.md. */
(function () {
  var box = document.querySelector('.share');
  if (!box) return;

  /* Always share the canonical URL, never whatever is in the address bar —
     that strips any #fragment, ?query, or the redirecting .html form. */
  var canonical = document.querySelector('link[rel="canonical"]');
  var ogTitle = document.querySelector('meta[property="og:title"]');
  var url = canonical ? canonical.href : location.href.split('#')[0];
  var title = ogTitle ? ogTitle.content : document.title;

  /* Native share sheet, phones only. navigator.share also exists on desktop
     Safari and Edge, where collapsing five visible options into one button
     would be a downgrade — so gate on a coarse pointer too. */
  var native = box.querySelector('.share-native');
  var row = box.querySelector('.share-row');
  if (native && row && navigator.share && window.matchMedia('(pointer: coarse)').matches) {
    native.hidden = false;
    row.hidden = true;
    native.addEventListener('click', function () {
      navigator.share({ title: title, url: url }).catch(function () {
        /* user dismissed the sheet, or the browser refused — nothing to do */
      });
    });
  }

  /* Copy link ships hidden and is revealed only where the clipboard API
     exists, so nobody is ever shown a button that cannot work. */
  var copy = box.querySelector('.s-copy');
  if (!copy || !navigator.clipboard) return;
  copy.hidden = false;

  var label = copy.querySelector('.lbl');
  var resting = label.textContent;
  var timer;

  function flash(text, ok) {
    if (ok) copy.classList.add('is-copied');
    label.textContent = text;
    clearTimeout(timer);
    timer = setTimeout(function () {
      copy.classList.remove('is-copied');
      label.textContent = resting;
    }, 2000);
  }

  /* Fallback for browsers that reject the async clipboard — Safari outside a
     trusted gesture, older WebKit, non-secure contexts. execCommand is
     deprecated but still the only thing that works in those cases. */
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  copy.addEventListener('click', function () {
    navigator.clipboard.writeText(url).then(function () {
      flash('Copied', true);
    }).catch(function () {
      var ok = legacyCopy(url);
      flash(ok ? 'Copied' : 'Copy failed', ok);
    });
  });
})();
