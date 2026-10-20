/* Contact form on the homepage. Posts to /api/contact (worker/index.js) with
   fetch, so the page never reloads. The form ships hidden and is revealed
   here, once the submit handler is attached, so nobody is ever shown a form
   that cannot send. The email and phone links above it work with this file
   blocked. See HANDOFF.md "Contact form".

   Spam check: Cloudflare Turnstile. Its script is loaded from here, only as
   the form nears the screen (or a field gets focus), so the rest of the page
   never waits on it. It runs in the background and stays invisible unless
   Cloudflare wants a click. Its one-time token goes out with the form. */
(function () {
  var form = document.querySelector('.contact-form');
  if (!form || !window.fetch || !window.FormData) return;

  var button = form.querySelector('.form-send');
  var label = button.querySelector('.lbl');
  var status = form.querySelector('.form-status');
  var box = form.querySelector('.ts-box');
  var resting = label.textContent;

  var EMAIL = 'jessebattleiv@gmail.com';
  var TS_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=jbTurnstileReady';
  var WAIT_MS = 20000; // longest Send will wait for the spam check to finish

  var opened = Date.now(); // the Worker rejects anything sent under 3 seconds
  var widget = null;       // Turnstile widget id
  var token = '';          // current Turnstile token, single use
  var waiting = false;     // Send was pressed before the token arrived
  var waitTimer = null;
  var tsLoaded = false;
  var tsBroken = false;    // script blocked or failed to load

  /* Success is a plain line. A failure gets the .is-error panel and a
     "Not sent" label, so the two never differ by wording alone. */
  function say(text, failed) {
    status.textContent = '';
    status.classList.toggle('is-error', !!failed);
    if (!text) return;
    if (failed) {
      var lab = document.createElement('span');
      lab.className = 'st-lab';
      lab.textContent = 'Not sent';
      status.appendChild(lab);
    }
    status.appendChild(document.createTextNode(text));
    if (failed) {
      var a = document.createElement('a');
      a.href = 'mailto:' + EMAIL;
      a.textContent = EMAIL;
      status.appendChild(document.createTextNode(' '));
      status.appendChild(a);
      status.appendChild(document.createTextNode('.'));
    }
  }

  function wait(seconds) {
    var m = Math.ceil(seconds / 60);
    return m <= 1 ? 'a minute' : m + ' minutes';
  }

  function busy(on, text) {
    button.disabled = on;
    label.textContent = on ? text : resting;
    if (on) form.setAttribute('aria-busy', 'true');
    else form.removeAttribute('aria-busy');
  }

  function stopWaiting() {
    waiting = false;
    clearTimeout(waitTimer);
  }

  function checkFailed() {
    stopWaiting();
    busy(false);
    say('The spam check could not finish in this browser, so the form cannot send. ' +
      'Your message is still here; you can copy it and email me at', true);
  }

  /* ---- Turnstile ---- */

  window.jbTurnstileReady = function () {
    if (!box || !window.turnstile) return checkFailed();
    widget = window.turnstile.render(box, {
      sitekey: box.getAttribute('data-sitekey'),
      action: 'contact',
      theme: 'dark',
      size: 'flexible',
      appearance: 'interaction-only',
      callback: function (t) {
        token = t;
        if (waiting) { stopWaiting(); send(); }
      },
      'expired-callback': function () { token = ''; },
      'error-callback': function () {
        token = '';
        if (waiting) checkFailed();
      }
    });
  };

  function loadTurnstile() {
    if (tsLoaded) return;
    tsLoaded = true;
    var s = document.createElement('script');
    s.src = TS_SRC;
    s.async = true;
    s.onerror = function () {
      tsBroken = true;
      if (waiting) checkFailed();
    };
    document.head.appendChild(s);
  }

  function freshToken() {
    token = '';
    if (widget !== null && window.turnstile) {
      try { window.turnstile.reset(widget); } catch (e) {}
    }
  }

  /* Load when the form is within about a screen of view, or on first focus,
     whichever comes first. */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); loadTurnstile(); }
    }, { rootMargin: '800px 0px' });
    io.observe(form);
  } else {
    loadTurnstile();
  }
  form.addEventListener('focusin', loadTurnstile);

  /* ---- Sending ---- */

  function send() {
    busy(true, 'Sending');
    var data = new FormData(form);
    data.set('cf-turnstile-response', token);
    data.set('elapsed_ms', String(Date.now() - opened));

    fetch(form.action, {
      method: 'POST',
      body: data,
      headers: { Accept: 'application/json' }
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (res.ok && data.ok) return;
          var err = new Error(data.error || 'HTTP ' + res.status);
          if (res.status === 429) {
            err.limit = data.limit;
            err.retryAfter = data.retryAfter || Number(res.headers.get('Retry-After')) || 3600;
          }
          throw err;
        });
      })
      .then(function () {
        /* Success is the only path that clears the fields. */
        form.reset();
        say('Thanks. Your message is on its way to me, and I will reply by email.');
      })
      .catch(function (err) {
        /* Failure leaves every field as typed, so nothing has to be retyped. */
        if (err.retryAfter) {
          say('This connection has sent ' + (err.limit || 'the most') + ' messages in the last hour, ' +
            'which is the limit. Your message is still here; you can send it in about ' +
            wait(err.retryAfter) + ', or email me at', true);
        } else {
          say('Your message is still here, so you can try again, or email me at', true);
        }
      })
      .then(function () {
        /* A token works once, sent or not, so fetch the next one now. */
        freshToken();
        busy(false);
      });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (button.disabled) return;
    say('', false);
    if (token) return send();
    if (tsBroken) return checkFailed();

    /* The check has not finished yet. Hold the send and fire it the moment
       the token arrives, or give up with the email address after WAIT_MS. */
    loadTurnstile();
    busy(true, 'Checking');
    waiting = true;
    waitTimer = setTimeout(checkFailed, WAIT_MS);
  });

  form.hidden = false;
})();
