/* Contact form on the homepage. Posts to /api/contact (worker/index.js) with
   fetch, so the page never reloads. The form ships hidden and is revealed
   here, once the submit handler is attached, so nobody is ever shown a form
   that cannot send. The email and phone links above it work with this file
   blocked. See HANDOFF.md "Contact form". */
(function () {
  var form = document.querySelector('.contact-form');
  if (!form || !window.fetch || !window.FormData) return;

  var button = form.querySelector('.form-send');
  var label = button.querySelector('.lbl');
  var status = form.querySelector('.form-status');
  var resting = label.textContent;

  var EMAIL = 'jessebattleiv@gmail.com';

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

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    button.disabled = true;
    label.textContent = 'Sending';
    form.setAttribute('aria-busy', 'true');
    say('', false);

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
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
        button.disabled = false;
        label.textContent = resting;
        form.removeAttribute('aria-busy');
      });
  });

  form.hidden = false;
})();
