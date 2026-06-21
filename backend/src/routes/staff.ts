import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { protect, restrictTo, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/staff
 * @desc    Get all staff members of the logged in restaurant admin
 * @access  Private (Restaurant Admin only)
 */
router.get('/', protect, restrictTo('restaurant_admin'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(400).json({ success: false, message: 'User is not associated with any restaurant.' });
    }

    const staffMembers = await User.find({
      restaurantId: req.user.restaurantId,
      role: { $in: ['staff', 'restaurant_admin'] },
    }).select('-password');

    return res.json({ success: true, count: staffMembers.length, data: staffMembers });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve staff members.', error: error.message });
  }
});

/**
 * @route   POST /api/staff
 * @desc    Create a new staff member for the restaurant
 * @access  Private (Restaurant Admin only)
 */
router.post('/', protect, restrictTo('restaurant_admin'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(400).json({ success: false, message: 'User is not associated with any restaurant.' });
    }

    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields (name, email, password, role) are required.' });
    }

    if (!['staff', 'restaurant_admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role value.' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email address is already in use.' });
    }

    // Hash password and save new User
    const hashedPassword = await bcrypt.hash(password, 10);
    const newStaff = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      restaurantId: req.user.restaurantId,
    });

    await newStaff.save();

    return res.status(201).json({
      success: true,
      message: 'Staff member created successfully.',
      data: {
        id: newStaff._id,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        restaurantId: newStaff.restaurantId,
      },
    });
  } catch (error: any) {
    console.error('Error creating staff:', error);
    return res.status(500).json({ success: false, message: 'Failed to create staff member.', error: error.message });
  }
});

/**
 * @route   PATCH /api/staff/:id
 * @desc    Update details of a staff member (Name, Role, password if specified)
 * @access  Private (Restaurant Admin only)
 */
router.patch('/:id', protect, restrictTo('restaurant_admin'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(400).json({ success: false, message: 'User is not associated with any restaurant.' });
    }

    const staffMember = await User.findOne({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
    });

    if (!staffMember) {
      return res.status(404).json({ success: false, message: 'Staff member not found in your restaurant.' });
    }

    // Cannot modify self through this route (use self profile edit instead)
    if (staffMember._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot modify your own admin account settings here.' });
    }

    const { name, role, password } = req.body;

    if (name) staffMember.name = name;
    if (role) {
      if (!['staff', 'restaurant_admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role value.' });
      }
      staffMember.role = role;
    }
    if (password) {
      staffMember.password = await bcrypt.hash(password, 10);
    }

    await staffMember.save();

    return res.json({
      success: true,
      message: 'Staff member updated successfully.',
      data: {
        id: staffMember._id,
        name: staffMember.name,
        email: staffMember.email,
        role: staffMember.role,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update staff member.', error: error.message });
  }
});

/**
 * @route   DELETE /api/staff/:id
 * @desc    Delete a staff member
 * @access  Private (Restaurant Admin only)
 */
router.delete('/:id', protect, restrictTo('restaurant_admin'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(400).json({ success: false, message: 'User is not associated with any restaurant.' });
    }

    // Find and delete
    const staffMember = await User.findOne({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
    });

    if (!staffMember) {
      return res.status(404).json({ success: false, message: 'Staff member not found in your restaurant.' });
    }

    if (staffMember._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete yourself.' });
    }

    await User.findByIdAndDelete(staffMember._id);

    return res.json({ success: true, message: 'Staff member removed successfully.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to remove staff member.', error: error.message });
  }
});

export default router;
