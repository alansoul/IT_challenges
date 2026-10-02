import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import dns from 'dns';
import dotenv from 'dotenv';
dotenv.config();

// Force Node.js DNS to prefer IPv4 (Fixes Railway ENETUNREACH IPv6 errors)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// Provider 1: Gmail / Custom SMTP Transporter (Forced IPv4)
function getSmtpTransporter() {
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : null;
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : null;
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();

  if (user && pass) {
    const port = Number(process.env.SMTP_PORT) || 465;
    const isSecure = process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === 'true'
      : port === 465;

    return nodemailer.createTransport({
      host: host,
      port: port,
      secure: isSecure,
      family: 4, // Force IPv4 to prevent Railway ENETUNREACH IPv6 errors
      auth: {
        user: user,
        pass: pass,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
  }
  return null;
}

// Provider 2: Resend API (Only active if a valid RESEND_API_KEY is provided)
const resendApiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : null;
const resend = resendApiKey && !resendApiKey.includes('your_') ? new Resend(resendApiKey) : null;
const FROM_RESEND = process.env.EMAIL_FROM || 'Cipher Cell CTF <onboarding@resend.dev>';

/**
 * Universal Email Dispatcher
 */
async function dispatchEmail({ toEmail, subject, html, text }) {
  const smtp = getSmtpTransporter();

  const withTimeout = (promise, name) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${name} connection timed out after 20s`)), 20000)
      ),
    ]);

  // --- 1. TRY GMAIL / CUSTOM SMTP FIRST ---
  if (smtp) {
    try {
      const fromAddress = process.env.SMTP_FROM || `"Cipher Cell CTF" <${process.env.SMTP_USER}>`;
      const info = await withTimeout(
        smtp.sendMail({
          from: fromAddress,
          to: toEmail,
          subject,
          text,
          html,
        }),
        'SMTP'
      );
      console.log(`[+] [SMTP] Email delivered to ${toEmail} (id: ${info.messageId})`);
      return { sent: true, provider: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.warn(`[-] [SMTP] Failed: ${err.message}. Trying Resend fallback...`);
    }
  }

  // --- 2. TRY RESEND API SECOND ---
  if (resend) {
    try {
      const resendPromise = resend.emails.send({
        from: FROM_RESEND,
        to: toEmail,
        subject,
        html,
        text,
      });

      const { data, error } = await withTimeout(resendPromise, 'Resend API');

      if (!error && data) {
        console.log(`[+] [Resend] Email delivered to ${toEmail} (id: ${data.id})`);
        return { sent: true, provider: 'resend', id: data.id };
      }
      console.warn(`[-] [Resend] Failed: ${error?.message || 'Unknown error'}`);
    } catch (err) {
      console.warn(`[-] [Resend] Failed: ${err.message}`);
    }
  }

  // --- 3. EMERGENCY FALLBACK: LOG TO SERVER CONSOLE ---
  console.log(`\n================ EMAIL DISPATCH FALLBACK (CONSOLE LOG) ================`);
  console.log(`To:      ${toEmail}`);
  console.log(`Subject: ${subject}`);
  console.log(`Text:\n${text}`);
  console.log(`======================================================================\n`);

  return { sent: false, provider: 'console' };
}

/**
 * Send 6-digit OTP for email verification
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
      <p style="font-size:13px; color:#9ca3af;">Expires in <strong style="color:#ff2a2a;">10 minutes</strong>. Do not share this code.</p>
      <p style="font-size:11px; color:#6b7280; margin-top:24px; border-top:1px solid #21262d; padding-top:16px;">
        If you did not request this, ignore this email.
      </p>
    </div>
  `;

  const text = `CIPHER CELL CTF — Clearance Code\n\nYour OTP: ${otp}\nExpires in 10 minutes.\n\nIf you did not request this, ignore this email.`;

  const result = await dispatchEmail({ toEmail, subject, html, text });
  return { ...result, otp };
}

/**
 * Send password-reset link
 */
export async function sendPasswordResetEmail(toEmail, resetToken) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

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
        Or paste manually:<br/>
        <span style="color:#9ca3af; word-break:break-all;">${resetLink}</span>
      </p>
    </div>
  `;

  const text = `
CIPHER CELL CTF — Password Reset
================================
Account: ${toEmail}
Expires in 15 minutes.

${resetLink}

If you did not request this, ignore this email.
  `.trim();

  const result = await dispatchEmail({ toEmail, subject, html, text });
  return { ...result, previewUrl: resetLink };
}