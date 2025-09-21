// In-memory OTP storage (in production, use Redis or database)
const otpStorage = new Map();

// Store OTP with expiration
const storeOTP = (email, otp) => {
  const expirationTime = Date.now() + (10 * 60 * 1000); // 10 minutes
  otpStorage.set(email, {
    otp,
    expiresAt: expirationTime,
    attempts: 0
  });
  
  // Clean up expired OTPs
  cleanupExpiredOTPs();
};

// Verify OTP
const verifyOTP = (email, providedOTP) => {
  const storedData = otpStorage.get(email);
  
  if (!storedData) {
    return { success: false, message: 'No OTP found for this email' };
  }
  
  // Check if OTP has expired
  if (Date.now() > storedData.expiresAt) {
    otpStorage.delete(email);
    return { success: false, message: 'OTP has expired' };
  }
  
  // Check attempt limit (max 3 attempts)
  if (storedData.attempts >= 3) {
    otpStorage.delete(email);
    return { success: false, message: 'Too many failed attempts. Please request a new OTP' };
  }
  
  // Verify OTP
  if (storedData.otp === providedOTP) {
    otpStorage.delete(email);
    return { success: true, message: 'OTP verified successfully' };
  } else {
    // Increment attempt count
    storedData.attempts += 1;
    otpStorage.set(email, storedData);
    
    const remainingAttempts = 3 - storedData.attempts;
    return { 
      success: false, 
      message: `Invalid OTP. ${remainingAttempts} attempts remaining` 
    };
  }
};

// Clean up expired OTPs
const cleanupExpiredOTPs = () => {
  const now = Date.now();
  for (const [email, data] of otpStorage.entries()) {
    if (now > data.expiresAt) {
      otpStorage.delete(email);
    }
  }
};

// Get OTP info (for debugging)
const getOTPInfo = (email) => {
  return otpStorage.get(email);
};

module.exports = {
  storeOTP,
  verifyOTP,
  getOTPInfo,
  cleanupExpiredOTPs
};

