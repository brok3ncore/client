const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const YANDEX_CAPTCHA_SERVER_KEY = process.env.YANDEX_CAPTCHA_SERVER_KEY;
const CLOUD_SESSION_SECRET = process.env.CLOUD_SESSION_SECRET || YANDEX_CAPTCHA_SERVER_KEY;
const SESSION_TTL_SECONDS = 60 * 60 * 8;

const json = (statusCode, payload) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

function signSession(expiresAt) {
  const payload = `${expiresAt}`;
  const signature = crypto.createHmac('sha256', CLOUD_SESSION_SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

function verifySession(token) {
  if (!CLOUD_SESSION_SECRET || !token) return false;
  const [expiresAt, signature] = token.split('.');
  if (!expiresAt || !signature || Number(expiresAt) < Math.floor(Date.now() / 1000)) return false;
  const expected = crypto.createHmac('sha256', CLOUD_SESSION_SECRET).update(expiresAt).digest('hex');
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

async function verifyCaptcha(token, ip) {
  if (!YANDEX_CAPTCHA_SERVER_KEY) return false;
  if (!token) return false;

  const body = new URLSearchParams({
    secret: YANDEX_CAPTCHA_SERVER_KEY,
    token,
  });

  if (ip) body.set('ip', ip);

  const response = await fetch('https://smartcaptcha.yandexcloud.net/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) return false;
  const result = await response.json();
  return result.status === 'ok';
}

async function authorize(event) {
  if (verifySession(event.headers['x-cloud-session-token'])) return { ok: true, sessionToken: event.headers['x-cloud-session-token'] };

  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'];
  const captchaOk = await verifyCaptcha(event.headers['x-captcha-token'], ip);
  if (!captchaOk) return { ok: false };

  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return { ok: true, sessionToken: signSession(expiresAt) };
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

exports.handler = async (event) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !CLOUD_SESSION_SECRET) {
    return json(503, { error: 'Cloud storage is not configured' });
  }

  const authorization = await authorize(event);
  if (!authorization.ok) {
    return json(403, { error: 'Captcha verification failed' });
  }

  try {
    if (event.httpMethod === 'GET') {
      const id = event.queryStringParameters?.id || 'music-school-demo';
      const rows = await supabaseRequest(`school_states?id=eq.${encodeURIComponent(id)}&select=data`);
      if (!rows[0]) return json(404, { data: null, sessionToken: authorization.sessionToken });
      return json(200, { data: rows[0].data, sessionToken: authorization.sessionToken });
    }

    if (event.httpMethod === 'POST') {
      const payload = JSON.parse(event.body || '{}');
      if (!payload.id || !payload.data) {
        return json(400, { error: 'id and data are required' });
      }

      await supabaseRequest('school_states?on_conflict=id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({ id: payload.id, data: payload.data, updated_at: new Date().toISOString() }),
      });

      return json(200, { ok: true, sessionToken: authorization.sessionToken });
    }

    return json(405, { error: 'Method not allowed' });
  } catch (error) {
    return json(500, { error: error.message });
  }
};
