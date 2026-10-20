/* The Worker behind jessebattle.com. Workers Assets serves every file in the
   repo before this runs, so the only requests that reach fetch() are ones
   that match no file: the contact form's POST to /api/contact, and 404s.
   Everything that is not the form goes back to the assets binding, so a
   404 is the same 404 it was before this file existed.

   The form sends through Resend's REST API with plain fetch, no SDK and no
   build step. Cloudflare Turnstile is the spam check. RESEND_API_KEY and
   TURNSTILE_SECRET_KEY are Cloudflare secrets, never in the repo. See
   HANDOFF.md "Contact form" for setup. */

import { DurableObject } from 'cloudflare:workers';

const LIMITS = { name: 200, email: 254, message: 5000 };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Sends per client per window. Resend's free plan stops at 100 a day, so
// this is what keeps one person from spending everyone else's quota.
const RATE = { limit: 3, windowMs: 60 * 60 * 1000 };
// Fastest a person could plausibly open the page and send the form.
const MIN_FILL_MS = 3000;
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/contact') {
      if (request.method !== 'POST') {
        return json({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'POST' });
      }
      return contact(request, env, url);
    }
    return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });
  }
};

async function contact(request, env, url) {
  // Every current browser sends Origin on a POST made with fetch, same-site
  // included. So a missing Origin is a script posting directly (curl, a
  // bot), and one from another host is a different site. Neither is this form.
  const origin = request.headers.get('Origin');
  let originHost = '';
  try { originHost = origin ? new URL(origin).host : ''; } catch {}
  if (originHost !== url.host) {
    return json({ ok: false, error: 'Forbidden' }, 403);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'Expected a form submission' }, 400);
  }

  // Honeypot: the field is hidden from people and skipped by the keyboard, so
  // anything in it came from a bot. Rejected outright, nothing is sent.
  if (String(form.get('ref_code') || '').trim() !== '') {
    return json({ ok: false, error: 'Rejected' }, 400);
  }

  const name = String(form.get('name') || '').replace(/\s+/g, ' ').trim();
  const email = String(form.get('email') || '').trim();
  const message = String(form.get('message') || '').trim();

  if (!name || !email || !message) {
    return json({ ok: false, error: 'Name, email and message are all required' }, 400);
  }
  if (name.length > LIMITS.name || email.length > LIMITS.email || message.length > LIMITS.message) {
    return json({ ok: false, error: 'A field is too long' }, 400);
  }
  if (!EMAIL.test(email)) {
    return json({ ok: false, error: 'That email address does not look right' }, 400);
  }

  // Too fast to be a person. contact.js sends how long the page had been
  // open when Send was pressed; nobody reads the page, scrolls to the form
  // and fills three fields in under 3 seconds. Missing means contact.js did
  // not send it, so this was not the real form either.
  const elapsed = Number(form.get('elapsed_ms'));
  if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) {
    return json({ ok: false, error: 'Rejected' }, 400);
  }

  // Cloudflare Turnstile. The widget in the form gets a one-time token that
  // only a real browser can earn; Cloudflare's siteverify says whether it is
  // genuine. Checked before the rate limit so bots never use up a real
  // visitor's slot. Fails closed: no secret, or siteverify unreachable,
  // means nothing is sent.
  const human = await turnstile(form.get('cf-turnstile-response'), request, env, url);
  if (!human.ok) {
    return json({ ok: false, error: human.error }, human.status);
  }

  // Rate limit. Checked only once a submission is valid, so junk never costs
  // a slot or a Durable Object call. If the limiter itself fails, nothing is
  // sent: protecting the quota is its whole job, and the error the visitor
  // sees still gives them the email address.
  let slot;
  try {
    const limiter = env.CONTACT_LIMIT.get(env.CONTACT_LIMIT.idFromName(clientKey(request)));
    slot = await limiter.take(RATE.limit, RATE.windowMs);
  } catch (err) {
    console.error('contact: rate limiter failed', err);
    return json({ ok: false, error: 'Could not send' }, 503);
  }
  if (!slot.ok) {
    return json(
      { ok: false, error: 'rate_limited', limit: RATE.limit, retryAfter: slot.retryAfter },
      429,
      { 'Retry-After': String(slot.retryAfter) }
    );
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
    console.error('contact: RESEND_API_KEY, CONTACT_TO or CONTACT_FROM is not set');
    return json({ ok: false, error: 'The form is not configured' }, 500);
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      // Resend rejects any request without a User-Agent with a 403.
      'User-Agent': 'jessebattle-contact-form'
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: [env.CONTACT_TO],
      reply_to: email, // so Reply in Gmail goes to the sender, not to the site
      subject: `Website message from ${name}`,
      text: `${message}\n\n--\n${name} <${email}>\nSent from the contact form on ${url.host}`
    })
  });

  if (!res.ok) {
    console.error('contact: Resend returned', res.status, await res.text());
    return json({ ok: false, error: 'Could not send' }, 502);
  }
  return json({ ok: true });
}

// Asks Cloudflare whether the Turnstile token is genuine, unused, and was
// issued on this site. Tokens last 300 seconds and work once; contact.js
// fetches a fresh one after every attempt.
async function turnstile(token, request, env, url) {
  token = String(token || '');
  if (!token || token.length > 2048) {
    return { ok: false, status: 400, error: 'turnstile_missing' };
  }
  if (!env.TURNSTILE_SECRET_KEY) {
    console.error('contact: TURNSTILE_SECRET_KEY is not set');
    return { ok: false, status: 500, error: 'The form is not configured' };
  }
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET_KEY);
  body.append('response', token);
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) body.append('remoteip', ip);

  let data;
  try {
    const res = await fetch(SITEVERIFY, { method: 'POST', body });
    data = await res.json();
  } catch (err) {
    console.error('contact: Turnstile siteverify failed', err);
    return { ok: false, status: 503, error: 'Could not send' };
  }
  // Hostname guards against a token earned on some other site that uses the
  // same widget. Local dev (wrangler dev, test keys) reports its own host.
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (!data.success || (!local && data.hostname !== url.hostname)) {
    console.log('contact: Turnstile rejected', data['error-codes'], data.hostname);
    return { ok: false, status: 403, error: 'turnstile_failed' };
  }
  return { ok: true };
}

// Who is sending, for the rate limit. CF-Connecting-IP is set by Cloudflare
// and cannot be forged by the client. IPv6 is grouped by its /64, the block a
// single connection is normally handed, or rotating through addresses inside
// it would dodge the limit entirely.
function clientKey(request) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!ip.includes(':')) return ip;
  const [head, tail = ''] = ip.toLowerCase().split('::');
  const h = head ? head.split(':') : [];
  const t = tail ? tail.split(':') : [];
  const groups = [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t];
  return groups.slice(0, 4).map(g => g.padStart(4, '0')).join(':') + '::/64';
}

// One object per client key, holding only the timestamps of that client's
// sends in the last window. Durable Objects run one request at a time per
// object, so two quick submissions cannot both read "2 sent" and both pass.
// An alarm deletes the object's storage one window after its last send, so
// nothing about a visitor is kept beyond the hour.
export class ContactRateLimit extends DurableObject {
  async take(limit, windowMs) {
    const now = Date.now();
    const hits = ((await this.ctx.storage.get('hits')) || []).filter(t => t > now - windowMs);
    if (hits.length >= limit) {
      return { ok: false, retryAfter: Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000)) };
    }
    hits.push(now);
    await this.ctx.storage.put('hits', hits);
    await this.ctx.storage.setAlarm(now + windowMs);
    return { ok: true };
  }

  async alarm() {
    await this.ctx.storage.deleteAll();
  }
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers }
  });
}
