import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import Bill from '../models/Bill';
import Order from '../models/Order';
import Restaurant from '../models/Restaurant';
import { protect, restrictTo, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/bills/order/:orderId
 * @desc    Get bill details by order ID (Public - used by tracking screen)
 * @access  Public
 */
router.get('/order/:orderId', async (req, res) => {
  try {
    const bill = await Bill.findOne({ orderId: req.params.orderId })
      .populate('orderId')
      .populate('restaurantId', 'name address contact gstNumber');
    
    if (!bill) {
      return res.status(404).json({ success: false, message: 'Bill has not been generated for this order yet.' });
    }

    return res.json({ success: true, data: bill });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch bill details.', error: error.message });
  }
});

/**
 * @route   GET /api/bills/my-restaurant
 * @desc    Get all bills generated for this restaurant tenant
 * @access  Private (Restaurant Admin / Staff)
 */
router.get('/my-restaurant', protect, restrictTo('restaurant_admin', 'staff'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || !req.user.restaurantId) {
      return res.status(400).json({ success: false, message: 'User is not associated with any restaurant.' });
    }

    const bills = await Bill.find({ restaurantId: req.user.restaurantId })
      .populate('orderId', 'customerName phoneNumber tableNumber')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: bills.length, data: bills });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch restaurant bills.', error: error.message });
  }
});

/**
 * @route   GET /api/bills/download/:filename
 * @desc    Download or view the invoice PDF
 * @access  Public
 */
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Safety check against path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ success: false, message: 'Invalid file parameter.' });
    }

    const filePath = path.join(__dirname, '../../public/bills', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Invoice PDF file not found.' });
    }

    // Set header to display PDF in browser or download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to download PDF.', error: error.message });
  }
});

export default router;
