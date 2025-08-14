import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Store verification codes temporarily (in production, use a database)
const verificationCodes = new Map<string, { code: string; timestamp: number }>();

// Generate a random 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create transporter for Gmail (you can change this to any email service)
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Send verification code email
export async function sendVerificationCode(email: string): Promise<string> {
  try {
    const code = generateVerificationCode();
    const timestamp = Date.now();
    
    // Store the code with timestamp (expires in 10 minutes)
    verificationCodes.set(email, { code, timestamp });
    
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email not configured, using demo mode. Code:', code);
      // In demo mode, just store the code and return success
      return code;
    }
    
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Get to the End - Password Reset</h2>
          <p>You requested to change your password. Here's your verification code:</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #4CAF50; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message from Get to the End game.</p>
        </div>
      `
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
    // Clean up expired codes
    cleanupExpiredCodes();
    
    return code;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send verification code');
  }
}

// Verify the code
export function verifyCode(email: string, code: string): boolean {
  const stored = verificationCodes.get(email);
  if (!stored) return false;
  
  // Check if code is expired (10 minutes)
  if (Date.now() - stored.timestamp > 10 * 60 * 1000) {
    verificationCodes.delete(email);
    return false;
  }
  
  // Check if code matches
  if (stored.code === code) {
    verificationCodes.delete(email); // Remove used code
    return true;
  }
  
  return false;
}

// Clean up expired codes
function cleanupExpiredCodes() {
  const now = Date.now();
  for (const [email, data] of verificationCodes.entries()) {
    if (now - data.timestamp > 10 * 60 * 1000) {
      verificationCodes.delete(email);
    }
  }
}

// For testing - get stored codes
export function getStoredCode(email: string): string | null {
  const stored = verificationCodes.get(email);
  return stored ? stored.code : null;
}
