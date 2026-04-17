import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendMail = async (options: SendMailOptions): Promise<void> => {
  await transporter.sendMail({
    from: `"GetSmart" <${process.env.SMTP_USER || "noreply@getsmart.com"}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
};

export const sendActivationEmail = async (
  email: string,
  token: string,
): Promise<void> => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const activationLink = `${baseUrl}/auth/activate?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
      <h2 style="color: #2563eb;">✅ GetSmart - Aktivasi Akun</h2>
      <p>Hai! Terima kasih telah mendaftar di GetSmart.</p>
      <p>Klik tombol di bawah untuk mengaktifkan akunmu:</p>
      <a href="${activationLink}" 
         style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">
        Aktifkan Akun
      </a>
      <p style="color: #6b7280; font-size: 14px;">Link ini akan kedaluwarsa dalam 15 menit.</p>
      <p style="color: #6b7280; font-size: 14px;">Jika kamu tidak mendaftar di GetSmart, abaikan email ini.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">GetSmart - Platform E-Learning Adaptif</p>
    </div>
  `;

  await sendMail({
    to: email,
    subject: "✅ Aktivasi Akun GetSmart",
    html,
  });
};

export const sendForgotPasswordEmail = async (
  email: string,
  token: string,
): Promise<void> => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">🔑 GetSmart - Reset Password</h2>
      <p>Hai! Kamu menerima email ini karena ada permintaan reset password untuk akun GetSmart-mu.</p>
      <p>Klik tombol di bawah untuk mengatur password baru:</p>
      <a href="${resetLink}" 
         style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">
        Reset Password
      </a>
      <p style="color: #6b7280; font-size: 14px;">Link ini akan kedaluwarsa dalam 15 menit.</p>
      <p style="color: #6b7280; font-size: 14px;">Jika kamu tidak meminta ini, abaikan email ini.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px;">GetSmart - Platform E-Learning Adaptif</p>
    </div>
  `;

  await sendMail({
    to: email,
    subject: "🔑 Reset Password GetSmart",
    html,
  });
};
