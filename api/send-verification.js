import crypto from 'crypto';

const SECRET = process.env.VERIFY_SECRET;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createToken(email, code) {
  const t = Date.now();
  const payload = `verify:${email}:${code}:${t}`;
  const hash = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ email, t, hash })).toString('base64url');
}

function verifyToken(token, email, code) {
  try {
    const data = JSON.parse(Buffer.from(token, 'base64url').toString());
    if (data.email !== email) return false;
    if (Date.now() - data.t > 5 * 60 * 1000) return false;
    const payload = `verify:${email}:${code}:${data.t}`;
    const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    return data.hash === expected;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  try {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!SECRET || !SMTP_USER || !SMTP_PASS) {
      return res.status(500).json({ error: 'Server configuration error: missing env vars' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { email, action, token, code } = body;

    if (!email || ![\w.-]+@[\w.-]+\.\w+/.test(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    if (action === 'verify') {
      if (!token || !code) {
        return res.status(400).json({ error: 'Missing token or code' });
      }
      const valid = verifyToken(token, email, code);
      return res.status(200).json({ valid });
    }

    const verificationCode = generateCode();
    const newToken = createToken(email, verificationCode);

    let nodemailer;
    try {
      nodemailer = await import('nodemailer');
    } catch (modErr) {
      return res.status(500).json({ error: 'Module nodemailer not found. Build may have failed to install dependencies.', detail: modErr.message });
    }

    const transporter = nodemailer.default.createTransport({
      host: 'smtp.qq.com',
      port: 465,
      secure: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"JJK 咒术回战" <${SMTP_USER}>`,
      to: email,
      subject: '【JJK 咒术回战】邮箱验证码',
      html: `
        <div style="font-family: 'Microsoft YaHei', sans-serif; max-width: 420px; margin: 0 auto; padding: 24px; background: #120000; color: #eee; border: 1px solid rgba(170,0,0,0.3);">
          <h2 style="color: #FF6666; letter-spacing: 0.15em; margin: 0 0 16px 0; font-size: 18px;">咒术回战 SANCTUM</h2>
          <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin: 0 0 12px 0;">你的邮箱验证码：</p>
          <div style="font-size: 36px; font-weight: bold; color: #FF6666; letter-spacing: 0.25em; padding: 12px 0; text-align: center;">${verificationCode}</div>
          <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 12px 0 0 0;">验证码 5 分钟内有效，请勿泄露给他人。</p>
        </div>
      `,
    });

    res.status(200).json({ token: newToken });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
