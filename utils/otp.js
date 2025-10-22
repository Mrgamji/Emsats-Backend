/**
 * Generates a 6-digit numeric OTP as a string.
 * @returns {string} The generated OTP.
 */
export function generateOTP() {
  // Generates a random integer between 100000 and 999999 and converts it to string
  return Math.floor(100000 + Math.random() * 900000).toString();
}
