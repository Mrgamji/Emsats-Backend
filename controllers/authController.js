import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';
import { validationResult } from 'express-validator';
import { generateOTP } from '../utils/otp.js'; // Your OTP generator
import { sendOtpEmail } from '../utils/email.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const OTP_EXPIRY_MINUTES = 10;

// --- Utility Functions ---
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};


// --- SIGNUP ---
export const signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ error: errors.array() });

    const { fullname, email, password, phone } = req.body;

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, existingUser) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (existingUser) return res.status(422).json({ error: 'Email already exists' });

      // Generate OTP before user creation
      const otp = generateOTP();
      const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000).toISOString();

      try {
        // Try sending OTP first
        await sendOtpEmail(email, fullname, otp, OTP_EXPIRY_MINUTES, 'Your EMSATS OTP Code');
      } catch (emailErr) {
        console.error('Failed to send OTP email:', emailErr);
        return res.status(500).json({ error: 'Failed to send OTP email. Please try again.' });
      }

      // Save OTP after successful email
      db.run(
        `INSERT INTO otp_cache (email, otp, expires_at, fullname, phone, password) VALUES (?, ?, ?, ?, ?, ?)`,
        [email, otp, expiry, fullname, phone, await bcrypt.hash(password, 10)],
        (err) => {
          if (err) return res.status(500).json({ error: 'Failed to store OTP data' });
          res.status(200).json({
            message: 'OTP sent successfully. Please verify to complete registration.'
          });
        }
      );
    });
  } catch (error) {
    console.error('Signup exception:', error);
    res.status(500).json({ error: 'An error occurred during signup' });
  }
};

// --- LOGIN ---
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ error: errors.array() });

    const { email, password } = req.body;

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

      const token = generateToken(user);
      res.json({ user, token });
    });
  } catch (error) {
    console.error('Login exception:', error);
    res.status(500).json({ error: 'Unexpected error' });
  }
};

// --- VERIFY OTP ---
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    db.get(`SELECT * FROM otp_cache WHERE email = ?`, [email], async (err, otpRecord) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err.message });
      }

      if (!otpRecord) {
        return res.status(400).json({ 
          error: 'Invalid or expired OTP', 
          reason: 'No matching OTP record found for this email. Please request a new OTP.' 
        });
      }

      const now = Date.now();
      const expiryTime = new Date(otpRecord.expires_at).getTime();
      if (now > expiryTime) {
        db.run(`DELETE FROM otp_cache WHERE email = ?`, [email]);
        return res.status(400).json({ error: 'OTP expired', reason: 'The OTP has expired. Please request a new OTP.' });
      }
      
      if (otpRecord.otp.trim() !== otp.trim()) {
        return res.status(400).json({ error: 'Invalid OTP', reason: 'The provided OTP does not match. Please check and try again.' });
      }
      

      // OTP valid — create user now
      db.run(
        `INSERT INTO users (name, email, phone, password, email_verified_at) VALUES (?, ?, ?, ?, ?)`,
        [
          otpRecord.fullname,
          email,
          otpRecord.phone,
          otpRecord.password,
          new Date().toISOString()
        ],
        function (err) {
          if (err) return res.status(500).json({ error: 'Failed to create user' });

          db.run(`DELETE FROM otp_cache WHERE email = ?`, [email]);
          const user = { id: this.lastID, fullname: otpRecord.fullname, email, phone: otpRecord.phone };
          const token = generateToken(user);

          res.status(201).json({ message: 'Account verified successfully!', user, token });
        }
      );
    });
  } catch (error) {
    console.error('Verify OTP exception:', error);
    res.status(500).json({ error: 'An error occurred during verification' });
  }
};


// --- RESEND OTP ---
export const resendOtp = async (req, res) => {
  const { email } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found' });

    const otp = generateOTP();
    const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000).toISOString();

    db.run(`DELETE FROM otp_cache WHERE email = ?`, [email]);
    db.run(`INSERT INTO otp_cache (email, otp, expires_at) VALUES (?, ?, ?)`, [email, otp, expiry], async (err) => {
      if (err) return res.status(500).json({ error: 'Failed to resend OTP' });

      // Send OTP email
      try {
        await sendOtpEmail(email, user.name, otp, OTP_EXPIRY_MINUTES, 'Your OTP Code has been Resent');
        res.status(201).json({ message: 'OTP Resent Successfully.' });
      } catch (e) {
        console.error('Failed to send OTP email:', e);
        res.status(500).json({ error: 'Failed to send OTP email' });
      }
    });
  });
};
// --- FORGOT PASSWORD ---
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
      if (err || !user) return res.status(404).json({ error: 'User not found' });

      const resetToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });

      db.run(`DELETE FROM password_reset_tokens WHERE email = ?`, [email]);
      db.run(
        `INSERT INTO password_reset_tokens (email, token, created_at) VALUES (?, ?, ?)`,
        [email, resetToken, new Date().toISOString()],
        (err) => {
          if (err) return res.status(500).json({ error: 'Failed to store reset token' });
          res.json({ message: 'Reset link sent to your email.' });
        }
      );
    });
  } catch (error) {
    console.error('Forgot password exception:', error);
    res.status(500).json({ error: 'Error sending reset link' });
  }
};

// --- UPDATE PASSWORD ---
export const updatePassword = async (req, res) => {
  try {
    const { email, password, token } = req.body;

    db.get(`SELECT * FROM password_reset_tokens WHERE email = ?`, [email], async (err, record) => {
      if (err || !record) return res.status(400).json({ error: 'Invalid or expired token' });

      const age = Date.now() - new Date(record.created_at).getTime();
      if (age > 60 * 60 * 1000) {
        db.run(`DELETE FROM password_reset_tokens WHERE email = ?`, [email]);
        return res.status(400).json({ error: 'Token expired' });
      }

      try {
        jwt.verify(token, JWT_SECRET);
      } catch {
        return res.status(400).json({ error: 'Invalid token' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      db.run(`UPDATE users SET password = ? WHERE email = ?`, [hashedPassword, email], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to update password' });

        db.run(`DELETE FROM password_reset_tokens WHERE email = ?`, [email]);
        res.status(201).json({ message: 'Password Updated Successfully.' });
      });
    });
  } catch (error) {
    console.error('Update password exception:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

// --- UPDATE PROFILE ---
export const updateProfile = (req, res) => {
  try {
    const { id } = req.user;
    const { name, phone } = req.body;

    if (!id) return res.status(401).json({ error: 'Unauthorized' });

    db.run(
      `UPDATE users SET 
        name = COALESCE(?, name), 
        phone = COALESCE(?, phone)
      WHERE id = ?`,
      [name, phone, id],
      function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found' });

        res.json({ message: 'Profile updated successfully' });
      }
    );
  } catch (error) {
    console.error('Update profile exception:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

// --- VERIFY EMAIL ---
export const verifyEmail = async (req, res) => {
  try {
    const { email, token } = req.body;

    // In this simplified SQLite version, we’ll just confirm the email exists.
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Mark email as verified
      db.run(`UPDATE users SET email_verified_at = ? WHERE email = ?`, [new Date().toISOString(), email], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to verify email' });
        res.json({ message: 'Email verified successfully.' });
      });
    });
  } catch (error) {
    console.error('Verify email exception:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};
// --- LOGOUT ---
export const logout = async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully.' });
  } catch {
    res.status(500).json({ error: 'An error occurred' });
  }
};
