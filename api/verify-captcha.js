export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ ok: false, message: 'Method not allowed' });
    return;
  }

  const secret = process.env.YANDEX_CAPTCHA_SECRET_KEY;
  const token = request.body?.token;
  const ip = request.headers['x-forwarded-for']?.split(',')[0] || request.socket?.remoteAddress || '';

  if (!secret) {
    response.status(500).json({ ok: false, message: 'YANDEX_CAPTCHA_SECRET_KEY is not configured' });
    return;
  }

  if (!token) {
    response.status(400).json({ ok: false, message: 'Captcha token is required' });
    return;
  }

  const params = new URLSearchParams({ secret, token, ip });
  const captchaResponse = await fetch('https://smartcaptcha.yandexcloud.net/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const result = await captchaResponse.json();

  if (result.status === 'ok') {
    response.status(200).json({ ok: true });
    return;
  }

  response.status(403).json({ ok: false, message: 'Captcha validation failed', details: result });
}
