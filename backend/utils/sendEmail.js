const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendOtpEmail = async (to, otp, username) => {
  const mailOptions = {
    from: `"EduVisionAI" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: `🔐 Your EduVisionAI Verification Code: ${otp}`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#0a0a1a;border-radius:20px;overflow:hidden;border:1px solid rgba(20,184,166,0.3)">
        <div style="background:linear-gradient(135deg,#14B8A6 0%,#6366F1 100%);padding:32px 24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px">EduVisionAI</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px">Email Verification</p>
        </div>
        <div style="padding:32px 24px;text-align:center">
          <p style="color:#e2e8f0;font-size:16px;margin:0 0 8px">Hey <strong style="color:#14B8A6">${username || 'there'}</strong>! 👋</p>
          <p style="color:#94a3b8;font-size:14px;margin:0 0 24px">Use this code to verify your email address:</p>
          <div style="background:rgba(20,184,166,0.1);border:2px dashed #14B8A6;border-radius:16px;padding:20px;margin:0 auto;display:inline-block">
            <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#14B8A6;font-family:monospace">${otp}</span>
          </div>
          <p style="color:#64748b;font-size:12px;margin:24px 0 0">⏰ This code expires in <strong style="color:#f59e0b">10 minutes</strong></p>
          <p style="color:#475569;font-size:11px;margin:16px 0 0">If you didn't request this, just ignore this email.</p>
        </div>
        <div style="background:rgba(255,255,255,0.03);padding:16px 24px;text-align:center;border-top:1px solid rgba(255,255,255,0.05)">
          <p style="color:#475569;font-size:11px;margin:0">© ${new Date().getFullYear()} EduVisionAI — AI-Powered Learning</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };
