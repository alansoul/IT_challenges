import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import dns from 'dns';
import dotenv from 'dotenv';
dotenv.config();

// Force Node.js DNS to resolve IPv4 first (prevents cloud provider IPv6 routing hangs)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// 1. Setup Resend (Optional fallback)
const resendApiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : null;
const resend = resendApiKey && !resendApiKey.includes('your_') ? new Resend(resendApiKey) : null;
const FROM_RESEND = process.env.EMAIL_FROM || 'Cipher Cell CTF <onboarding@resend.dev>';

// 2. Setup Local/Custom SMTP Transporter (Fallback for localhost)
function getSmtpTransporter() {
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : null;
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : null;

  if (!user || !pass) return null;

  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();

  if (host.includes('gmail')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 4000,
    });
  }

  const port = Number(process.env.SMTP_PORT) || 465;
  const isSecure = process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === 'true'
    : port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: { user, pass },
    connectionTimeout: 4000,
    greetingTimeout: 4000,
    socketTimeout: 4000,
  });
}

/**
 * Strategy 1: Brevo HTTPS REST API (Port 443)
 * Never blocked by Railway; delivers to ANY student email without DNS verification.
 */
async function sendViaBrevo({ toEmail, subject, html, text }) {
  const apiKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : null;
  if (!apiKey || apiKey.includes('your_')) return null;

  const senderEmail = (
    process.env.BREVO_SENDER_EMAIL ||
    process.env.SMTP_USER ||
    ''
  ).trim();

  if (!senderEmail) {
    console.warn('[-] [Brevo Notice] BREVO_SENDER_EMAIL is missing in environment variables.');
    return null;
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: 'Cipher Cell CTF',
        email: senderEmail,
      },
      to: [{ email: toEmail }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Brevo HTTP error ${response.status}`);
  }

  console.log(`[+] [Brevo HTTPS Delivered] Sent to ${toEmail} (ID: ${data.messageId || 'OK'})`);
  return { sent: true, provider: 'brevo', messageId: data.messageId };
}

/**
 * Universal Email Dispatcher
 * Priority: 1. Brevo HTTPS API -> 2. Resend API -> 3. SMTP -> 4. Server Console Log
 */
async function dispatchEmail({ toEmail, subject, html, text }) {
  // --- 1. TRY BREVO REST API (HTTPS Port 443 - Fast & Unblocked) ---
  try {
    const brevoResult = await sendViaBrevo({ toEmail, subject, html, text });
    if (brevoResult) return brevoResult;
  } catch (err) {
    console.warn(`[-] [Brevo API Error]: ${err.message}. Trying next provider...`);
  }

  // --- 2. TRY RESEND API ---
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_RESEND,
        to: toEmail,
        subject,
        html,
        text,
      });

      if (!error && data) {
        console.log(`[+] [Resend Delivered] Sent to ${toEmail} (ID: ${data.id})`);
        return { sent: true, provider: 'resend', id: data.id };
      }
      console.warn(`[-] [Resend Notice]: ${error?.message || 'Unknown error'}`);
    } catch (err) {
      console.warn(`[-] [Resend Error]: ${err.message}`);
    }
  }

  // --- 3. TRY SMTP (Localhost only) ---
  const smtp = getSmtpTransporter();
  if (smtp) {
    try {
      const fromAddress = process.env.SMTP_FROM || `"Cipher Cell CTF" <${process.env.SMTP_USER}>`;
      const info = await smtp.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        text,
        html,
      });
      console.log(`[+] [SMTP Delivered] Sent to ${toEmail} (ID: ${info.messageId})`);
      return { sent: true, provider: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.warn(`[-] [SMTP Blocked/Failed]: ${err.message}`);
    }
  }

  // --- 4. EMERGENCY FALLBACK: LOG TO SERVER CONSOLE ---
  console.log(`\n================ EMAIL DISPATCH FALLBACK (CONSOLE LOG) ================`);
  console.log(`To:      ${toEmail}`);
  console.log(`Subject: ${subject}`);
  console.log(`Text:\n${text}`);
  console.log(`======================================================================\n`);

  return { sent: false, provider: 'console' };
}

/**
 * Send password-reset link
 */
export async function sendPasswordResetEmail(toEmail, resetToken) {
  const rawUrl = process.env.FRONTEND_URL || 'https://it-challenges.vercel.app';
  const cleanUrl = rawUrl.replace(/\/+$/, '');
  const resetLink = `${cleanUrl}/reset-password?token=${resetToken}`;

  const subject = 'CIPHER CELL CTF — Password Reset Token';

  const html = `
    <div style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background:#0c1017; color:#e6edf3; padding:32px; border-radius:12px; border:1px solid #21262d;">
      <h2 style="color:#ff2a2a; margin:0 0 8px;">Murder Mystery 2.0</h2>
      <p style="color:#a0aec0; font-size:12px; margin:0 0 24px;">CIPHER CELL CTF · Secure Recovery</p>
      <p style="font-size:14px; line-height:1.6;">
        A password reset was requested for
        <strong style="color:#fff;">${toEmail}</strong>.
      </p>
      <p style="font-size:14px; line-height:1.6;">This link expires in <strong>15 minutes</strong>.</p>
      <a href="${resetLink}"
         style="display:inline-block; margin:24px 0; background:#ff2a2a; color:#fff; text-decoration:none; font-weight:bold; font-size:13px; padding:12px 24px; border-radius:8px; letter-spacing:0.05em;">
        RESET PASSWORD →
      </a>
      <p style="font-size:11px; color:#6b7280; margin-top:24px; border-top:1px solid #21262d; padding-top:16px;">
        If you did not request this, ignore this email.
        <br/><br/>
        Or paste this link into your browser:<br/>
        <span style="color:#9ca3af; word-break:break-all;">${resetLink}</span>
      </p>
    </div>
  `;

  const text = `
CIPHER CELL CTF — Password Reset
================================
Account: ${toEmail}
Expires in 15 minutes.

Reset Link:
${resetLink}

If you did not request this, ignore this email.
  `.trim();

  const result = await dispatchEmail({ toEmail, subject, html, text });
  return { ...result, previewUrl: resetLink };
}

/**
 * Send 6-digit OTP (Optional)
 */
export async function sendOtpEmail(toEmail, otp) {
  const subject = `[CIPHER CELL] ${otp} is your clearance code`;

  const html = `
    <div style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background:#0c1017; color:#e6edf3; padding:32px; border-radius:12px; border:1px solid #21262d;">
      <h2 style="color:#ff2a2a; margin:0 0 8px;">Murder Mystery 2.0</h2>
      <p style="color:#a0aec0; font-size:12px; margin:0 0 24px;">CIPHER CELL CTF · Detective Clearance</p>
      <p style="font-size:14px; line-height:1.6;">
        Your one-time clearance code for
        <strong style="color:#fff;">${toEmail}</strong>:
      </p>
      <div style="margin:24px 0; background:#161b22; border:1px solid #30363d; border-radius:8px; padding:16px 24px; display:inline-block;">
        <span style="font-size:32px; font-weight:bold; letter-spacing:12px; color:#ffffff;">${otp}</span>
      </div>
      <p style="font-size:13px; color:#9ca3af;">Expires in <strong style="color:#ff2a2a;">10 minutes</strong>.</p>
    </div>
  `;

  const text = `CIPHER CELL CTF — Clearance Code\n\nYour OTP: ${otp}\nExpires in 10 minutes.`;
  const result = await dispatchEmail({ toEmail, subject, html, text });
  return { ...result, otp };
}