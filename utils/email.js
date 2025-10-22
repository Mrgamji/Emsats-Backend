import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: 'gradesattendancesystem@gmail.com',
    pass: 'nwgr vzxq glvy qeev',
  },
});

/**
 * Sends a stylish OTP email
 * @param {string} to - Recipient email
 * @param {string} fullname - Recipient full name
 * @param {string} otp - OTP code
 * @param {number} expiryMinutes - OTP expiry time in minutes
 * @param {string} subject - Email subject
 */
export const sendOtpEmail = async (to, fullname, otp, expiryMinutes = 10, subject = 'Your OTP Code') => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width:480px; margin:40px auto; border:1px solid #eee; border-radius:14px; overflow:hidden; box-shadow: 0 2px 12px #0001;">
      <div style="background: linear-gradient(90deg,#0047AB 0,#5B86E5 100%); color:white; padding:28px 0; text-align:center">
        <h1 style="margin:0; font-size:2rem; letter-spacing:1px;">Welcome to EMSATS!</h1>
      </div>
      <div style="background:#fff; padding:32px 24px;">
        <h2 style="margin-top:0; color:#0047AB;">Verify your email address</h2>
        <p>Dear <b>${fullname}</b>,</p>
        <p>Thank you for signing up. To complete your registration, please use the OTP code below:</p>
        <div style="margin: 32px 0; text-align:center;">
          <span style="display:inline-block; background:linear-gradient(90deg,#0047AB,#5B86E5); color:white; font-size:36px; letter-spacing:12px; padding:20px 32px; border-radius:12px; font-weight:bold; box-shadow:0 2px 6px #0047ab22;">${otp}</span>
        </div>
        <p style="color: #888;">This OTP will expire in <b>${expiryMinutes} minutes</b>.</p>
        <p style="margin:32px 0 0 0;">If you didn't create an account, just ignore this email.</p>
      </div>
      <div style="font-size:.95em; color:#aaa; background:#f4f6fa; text-align:center; padding:16px">
        &copy; ${new Date().getFullYear()} EMSATS. All rights reserved.
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"EMSATS" <no-reply@ourapp.com>',
    to,
    subject,
    html,
  });
};

/**
 * Sends a generic email with subject and HTML content
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 */
export const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({ from: process.env.EMAIL_FROM || 'EMSATS', to, subject, html });
};
