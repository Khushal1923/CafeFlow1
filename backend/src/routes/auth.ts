import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Restaurant from '../models/Restaurant';
import Otp from '../models/Otp';
import { generateOTP, sendOTP } from '../utils/otp';
import { protect, restrictTo, AuthRequest } from '../middleware/auth';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-1234';

/**
 * @route   POST /api/auth/register-restaurant
 * @desc    Sign up a new restaurant tenant and create its administrator
 * @access  Public
 */
router.post('/register-restaurant', async (req: Request, res: Response) => {
  try {
    const { restaurantName, address, contact, slug, adminName, email, password } = req.body;

    if (!restaurantName || !address || !contact || !slug || !adminName || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Check slug uniqueness
    const existingRestaurant = await Restaurant.findOne({ slug: slug.toLowerCase() });
    if (existingRestaurant) {
      return res.status(400).json({ success: false, message: 'Restaurant URL slug is already taken.' });
    }

    // Check user uniqueness
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    // Create Restaurant
    const restaurant = new Restaurant({
      name: restaurantName,
      slug: slug.toLowerCase().replace(/[^a-z0-9-_]/g, ''),
      address,
      contact,
      status: 'active',
    });
    await restaurant.save();

    // Hash password and create Admin User
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name: adminName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'restaurant_admin',
      restaurantId: restaurant._id,
    });
    await user.save();

    // Create JWT token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      success: true,
      message: 'Restaurant registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
      },
      restaurant,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate admin or staff user and return token
 * @access  Public
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Load tenant details if associated
    let restaurantObj = null;
    if (user.restaurantId) {
      restaurantObj = await Restaurant.findById(user.restaurantId);
      if (restaurantObj && restaurantObj.status === 'suspended') {
        return res.status(403).json({ success: false, message: 'Your restaurant tenant has been suspended.' });
      }
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
      },
      restaurant: restaurantObj,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: error.message });
  }
});

/**
 * @route   POST /api/auth/otp/send
 * @desc    Generate and send 6 digit OTP to customer number
 * @access  Public (Customer context)
 */
router.post('/otp/send', async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    // Clean formatting
    const formattedPhone = phoneNumber.trim();

    // Create 6-digit OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes expiry

    // Save to Database (upsert to overwrite active OTPs for the phone)
    await Otp.findOneAndUpdate(
      { phoneNumber: formattedPhone },
      { otp: otpCode, expiresAt, verified: false },
      { upsert: true, new: true }
    );

    // Call service to send SMS/Mock console
    await sendOTP(formattedPhone, otpCode);

    return res.json({
      success: true,
      message: 'OTP sent successfully. Valid for 2 minutes.',
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP.', error: error.message });
  }
});

/**
 * @route   POST /api/auth/otp/verify
 * @desc    Verify customer 6 digit OTP
 * @access  Public (Customer context)
 */
router.post('/otp/verify', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) {
      return res.status(400).json({ success: false, message: 'Phone number and OTP code are required.' });
    }

    const formattedPhone = phoneNumber.trim();

    // Find the latest active OTP
    const otpRecord = await Otp.findOne({ phoneNumber: formattedPhone });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'No OTP requested for this phone number.' });
    }

    // Validate expiration
    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Validate correctness
    if (otpRecord.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    return res.json({
      success: true,
      message: 'Phone number verified successfully.',
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify OTP.', error: error.message });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get details of current logged in user
 * @access  Private
 */
router.get('/me', protect, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    // Fetch full restaurant details if applicable
    let restaurantObj = null;
    if (req.user.restaurantId) {
      restaurantObj = await Restaurant.findById(req.user.restaurantId);
    }

    return res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        restaurantId: req.user.restaurantId,
      },
      restaurant: restaurantObj,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

export default router;
