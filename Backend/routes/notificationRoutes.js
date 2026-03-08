const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

// @desc    Get all notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

module.exports = router;
