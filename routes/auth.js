import express from 'express';
import { body } from 'express-validator';
import {
  signup,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  updatePassword,
  updateProfile,
  logout,
  verifyEmail
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/login',
  body('email').isEmail(),
  body('password').notEmpty(),
  login
);

router.post('/signup',
  body('fullname').notEmpty().isString(),
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('password_confirmation').custom((value, { req }) => value === req.body.password),
  signup
);

router.post('/forgot-password',
  body('email').isEmail(),
  forgotPassword
);

router.post('/verify-email',
  body('email').isEmail(),
  body('token').notEmpty(),
  verifyEmail
);

router.post('/verify-otp',
  body('email').isEmail(),
  body('otp').isLength({ min: 6, max: 6 }),
  verifyOtp
);

router.post('/resend-otp',
  body('email').isEmail(),
  resendOtp
);

router.post('/password/update',
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('password_confirmation').custom((value, { req }) => value === req.body.password),
  body('token').notEmpty(),
  updatePassword
);

router.post('/updateProfile', authenticate, updateProfile);

router.post('/logout', authenticate, logout);

router.get('/users', async (req, res) => {
  try {
    const { supabase } = await import('../config/supabase.js');
    const { data, error } = await supabase.from('users').select('*');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
