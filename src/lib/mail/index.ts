import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const port = Number(process.env.MAIL_PORT ?? 587);
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port,
      // 465 = SMTPS (TLS langsung); 587/2525 = STARTTLS
      secure: port === 465,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }
  return transporter;
}

function isMailConfigured(): boolean {
  return Boolean(process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PASS);
}

/**
 * Kirim email. Tidak melempar error agar kegagalan SMTP tidak menggagalkan
 * alur register/forgot-password. Jika SMTP belum dikonfigurasi atau gagal,
 * isi email di-log ke server (dev fallback) sehingga token/OTP tetap bisa dipakai.
 */
export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  if (!isMailConfigured()) {
    console.warn(`[mail] SMTP belum dikonfigurasi — email tidak dikirim. To: ${to} | ${subject}`);
    console.warn(`[mail] Isi (dev fallback):\n${html}`);
    return;
  }

  try {
    await getTransporter().sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      html,
    });
  } catch (error) {
    // Jangan gagalkan request hanya karena email gagal terkirim.
    console.error(`[mail] Gagal mengirim email ke ${to}:`, error);
    console.warn(`[mail] Isi (dev fallback):\n${html}`);
  }
}

export async function sendVerificationEmail(to: string, nama: string, token: string): Promise<void> {
  const link = `${process.env.APP_URL}/verify?token=${token}`;
  await sendMail(
    to,
    "Verifikasi Akun Inventaris Fakultas",
    `<p>Halo ${nama},</p>
     <p>Klik tautan berikut untuk memverifikasi akun Anda (berlaku 24 jam):</p>
     <p><a href="${link}">${link}</a></p>`,
  );
}

export async function sendPasswordResetOtp(to: string, nama: string, otp: string): Promise<void> {
  await sendMail(
    to,
    "Kode OTP Reset Password - Inventaris Fakultas",
    `<p>Halo ${nama},</p>
     <p>Kode OTP untuk reset password Anda (berlaku 10 menit):</p>
     <p style="font-size: 24px; font-weight: bold;">${otp}</p>`,
  );
}
