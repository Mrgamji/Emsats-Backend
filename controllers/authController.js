import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { validationResult } from 'express-validator';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const OTP_EXPIRY_MINUTES = 10;

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array() });
    }

    const { fullname, email, password, phone } = req.body;

    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.status(422).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        name: fullname,
        email,
        phone,
        password: hashedPassword
      }])
      .select()
      .single();

    if (error) {
      console.error('Signup error:', error);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);

    await supabase
      .from('otp_cache')
      .insert([{
        email: user.email,
        otp,
        expires_at: otpExpiry.toISOString()
      }]);

    const token = generateToken(user);

    res.status(201).json({
      user,
      token,
      message: 'User registered successfully.'
    });
  } catch (error) {
    console.error('Signup exception:', error);
    res.status(500).json({ error: 'An error occurred during signup' });
  }
};

export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array() });
    }

    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!user || error) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      user,
      token
    });
  } catch (error) {
    console.error('Login exception:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array() });
    }

    const { email, otp } = req.body;

    const { data: otpRecord, error } = await supabase
      .from('otp_cache')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (!otpRecord || error) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    if (new Date() > new Date(otpRecord.expires_at)) {
      await supabase.from('otp_cache').delete().eq('email', email);
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    await supabase
      .from('users')
      .update({ email_verified_at: new Date().toISOString() })
      .eq('email', email);

    await supabase.from('otp_cache').delete().eq('email', email);

    const token = generateToken(user);

    res.json({
      message: 'OTP verified successfully',
      token,
      token_type: 'bearer',
      user
    });
  } catch (error) {
    console.error('Verify OTP exception:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array() });
    }

    const { email } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);

    await supabase
      .from('otp_cache')
      .delete()
      .eq('email', email);

    await supabase
      .from('otp_cache')
      .insert([{
        email,
        otp,
        expires_at: otpExpiry.toISOString()
      }]);

    res.status(201).json({
      message: 'OTP Resent Successfully.'
    });
  } catch (error) {
    console.error('Resend OTP exception:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array() });
    }

    const { email } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1h' });

    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('email', email);

    await supabase
      .from('password_reset_tokens')
      .insert([{
        email,
        token: resetToken,
        created_at: new Date().toISOString()
      }]);

    res.json({ message: 'Reset link sent to your email.' });
  } catch (error) {
    console.error('Forgot password exception:', error);
    res.status(500).json({ error: 'An error occurred while sending reset link' });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array() });
    }

    const { email, password, token } = req.body;

    const { data: resetRecord } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const tokenAge = Date.now() - new Date(resetRecord.created_at).getTime();
    if (tokenAge > 60 * 60 * 1000) {
      await supabase.from('password_reset_tokens').delete().eq('email', email);
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', email);

    await supabase.from('password_reset_tokens').delete().eq('email', email);

    res.status(201).json({
      message: 'Password Updated Successfully.'
    });
  } catch (error) {
    console.error('Update password exception:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array() });
    }

    const user = req.user;
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const nameParts = userData.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const employeeData = {
      email: userData.email,
      phone: userData.phone,
      first_name: req.body.first_name || firstName,
      last_name: req.body.last_name || lastName,
      photo: req.body.photo,
      address: req.body.address,
      emergency_contact_name: req.body.emergency_contact_name,
      emergency_contact_phone: req.body.emergency_contact_phone,
      designation: req.body.designation,
      department: req.body.department,
      manager_id: req.body.manager_id,
      employment_type: req.body.employment_type,
      date_of_joining: req.body.date_of_joining,
      employee_code: req.body.employee_code,
      gender: req.body.gender,
      date_of_birth: req.body.date_of_birth,
      role: req.body.role
    };

    const { data: existingEmployee } = await supabase
      .from('employees')
      .select('*')
      .eq('email', userData.email)
      .maybeSingle();

    if (existingEmployee) {
      const { data: updatedEmployee, error } = await supabase
        .from('employees')
        .update(employeeData)
        .eq('email', userData.email)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      return res.json({
        message: 'Employee profile updated successfully.',
        employee: updatedEmployee
      });
    } else {
      const { data: newEmployee, error } = await supabase
        .from('employees')
        .insert([employeeData])
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to create profile' });
      }

      return res.json({
        message: 'Employee profile created successfully.',
        employee: newEmployee
      });
    }
  } catch (error) {
    console.error('Update profile exception:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

export const logout = async (req, res) => {
  try {
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array() });
    }

    res.json({ message: 'Email verified successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
};
