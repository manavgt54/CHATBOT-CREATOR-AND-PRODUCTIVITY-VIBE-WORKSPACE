const sgMail = require('@sendgrid/mail');
require('dotenv').config();

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  try {
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL,
      subject: 'OTP Verification - AI Chatbot Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🎵 AI Chatbot Platform</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">OTP Verification</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin: 0 0 20px 0;">Your Verification Code</h2>
            <p style="color: #666; margin: 0 0 20px 0; line-height: 1.6;">
              Thank you for registering with our AI Chatbot Platform! To complete your registration, please use the following One-Time Password (OTP):
            </p>
            
            <div style="background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #667eea; font-size: 36px; margin: 0; letter-spacing: 5px; font-family: 'Courier New', monospace;">${otp}</h1>
            </div>
            
            <p style="color: #666; margin: 20px 0 0 0; font-size: 14px; line-height: 1.6;">
              <strong>Important:</strong><br>
              • This OTP is valid for 10 minutes<br>
              • Do not share this code with anyone<br>
              • If you didn't request this, please ignore this email
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
              <p style="color: #999; margin: 0; font-size: 12px;">
                This is an automated message from AI Chatbot Platform
              </p>
            </div>
          </div>
        </div>
      `
    };

    await sgMail.send(msg);
    console.log(`✅ OTP sent to ${email}: ${otp}`);
    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('❌ SendGrid Error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail
};

