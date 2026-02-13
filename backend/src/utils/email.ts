import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

export async function testEmailConnection() {
  try {
    await transporter.verify();
    console.log("✅ Email server connection verified");
    return true;
  } catch (error) {
    console.error("❌ Email server connection failed:", error);
    return false;
  }
}

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const info = await transporter.sendMail({
      from: `"ScribbleX" <${env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("✅ Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    return { success: false, error };
  }
}

export async function sendOTPEmail(to: string, otp: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
      <div style="background: white; padding: 40px; border-radius: 10px; text-align: center;">
        <h1 style="color: #333; margin-bottom: 20px;">Verify Your Email</h1>
        <p style="color: #666; font-size: 16px; margin-bottom: 30px;">Your verification code is:</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; margin-bottom: 30px;">
          ${otp}
        </div>
        <p style="color: #999; font-size: 14px;">This code will expire in 10 minutes.</p>
        <p style="color: #999; font-size: 14px; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
      </div>
    </div>
  `;
  return sendEmail(to, "Verify Your Email - ScribbleX", html);
}

export async function sendPasswordResetEmail(to: string, resetToken: string) {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
      <div style="background: white; padding: 40px; border-radius: 10px;">
        <h1 style="color: #333; margin-bottom: 20px; text-align: center;">Reset Your Password</h1>
        <p style="color: #666; font-size: 16px; margin-bottom: 30px; text-align: center;">Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 40px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #999; font-size: 14px; text-align: center;">This link will expire in 1 hour.</p>
        <p style="color: #999; font-size: 14px; margin-top: 20px; text-align: center;">If you didn't request this, please ignore this email.</p>
        <p style="color: #ccc; font-size: 12px; margin-top: 30px; text-align: center; word-break: break-all;">Or copy this link: ${resetUrl}</p>
      </div>
    </div>
  `;
  return sendEmail(to, "Reset Your Password - ScribbleX", html);
}

export { transporter };
