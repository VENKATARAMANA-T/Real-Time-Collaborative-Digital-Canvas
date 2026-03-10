const Feedback = require('../models/Feedback');
const ActivityLog = require('../models/ActivityLog');

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Private
const submitFeedback = async (req, res) => {
  try {
    const { type, rating, description, contactEmail, attachmentUrl } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Description is required' });
    }

    const feedback = await Feedback.create({
      user: req.user._id,
      type: type || 'general',
      rating: rating || 0,
      description: description.trim(),
      contactEmail: contactEmail || '',
      attachmentUrl: attachmentUrl || ''
    });

    // Log the activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'SUBMIT_FEEDBACK'
    });

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: {
        id: feedback._id,
        type: feedback.type,
        status: feedback.status,
        createdAt: feedback.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
};

// @desc    Get all feedback (admin)
// @route   GET /api/feedback
// @access  Private
const getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch feedback' });
  }
};

module.exports = { submitFeedback, getAllFeedback };
