const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Canvas = require('../models/Canvas');
const Folder = require('../models/Folder');
const Meeting = require('../models/Meeting');
const mongoose = require('mongoose');
const {
  signAccessToken,
  signRefreshToken,
  hashToken,
  setAuthCookies,
} = require('../utils/tokenService');
const { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');

// @desc    Update User Profile (Username/Email/Profile Image)
// @route   PUT /api/users/:id/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { username, email, profileImage } = req.body;

    // Email uniqueness check
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    if (username) user.username = username;

    // Handle profile image upload to Cloudinary
    if (profileImage && profileImage.startsWith('data:')) {
      // Delete old profile image from Cloudinary if exists
      if (user.profileImagePublicId) {
        try {
          await deleteFromCloudinary(user.profileImagePublicId);
        } catch (deleteErr) {
          console.warn('Failed to delete old profile image:', deleteErr.message);
        }
      }

      // Upload new profile image to Cloudinary
      const result = await uploadToCloudinary(profileImage, {
        folder: 'RealTimeDigitalCanvas/profiles',
        transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'face', quality: 'auto' }],
      });

      user.profileImage = result.secure_url;
      user.profileImagePublicId = result.public_id;
    } else if (profileImage === '') {
      // Clear profile image
      if (user.profileImagePublicId) {
        try {
          await deleteFromCloudinary(user.profileImagePublicId);
        } catch (deleteErr) {
          console.warn('Failed to delete old profile image:', deleteErr.message);
        }
      }
      user.profileImage = '';
      user.profileImagePublicId = '';
    }

    const updatedUser = await user.save();

    // Log Activity
    try {
      const log = await ActivityLog.create({ user: user._id, action: 'UPDATE_PROFILE' });
      if (req.app && req.app.get('io')) {
        req.app.get('io').to(user._id.toString()).emit('activity_update', { userId: user._id, log });
      }
    } catch (logErr) {
      console.warn('Activity log failed:', logErr.message);
    }

    // ✅ Success status
    res.status(200).json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      profileImage: updatedUser.profileImage,
      createdAt: updatedUser.createdAt
    });

  } catch (error) {
    console.error("Update Profile Error:", error.message);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};


// @desc    Update user password
// @route   PUT /api/users/:id/password
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!req.user || req.user._id.toString() !== id) {
      return res.status(403).json({ message: "Not authorized to change this password" });
    }

    const user = await User.findById(id).select('+password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid old password" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    user.refreshTokenHash = await hashToken(refreshToken);

    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      message: "Password updated successfully"
    });

  } catch (error) {
    console.error("Update Password Error:", error.message);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

// @desc    Get activity logs for a user
// @route   GET /api/users/:id/activity-logs
// @access  Private
const getUserActivityLogs = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || req.user._id.toString() !== id) {
      return res.status(403).json({ message: "Not authorized to view these logs" });
    }

    const logs = await ActivityLog.find({ user: id })
      .sort({ timestamp: -1 })
      .lean();

    return res.status(200).json({ logs });
  } catch (error) {
    console.error("Get Activity Logs Error:", error.message);
    return res.status(500).json({ message: error.message || "Server Error" });
  }
};

// @desc    Delete user account and all associated data
// @route   DELETE /api/users/me
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user._id;

    if (!password) {
      return res.status(400).json({ message: "Password is required to delete your account." });
    }

    // 1. Find user and verify password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password. Account deletion aborted." });
    }

    // 2. Cascade Delete All User Data
    const promises = [
      Canvas.deleteMany({ owner: userId }),
      Folder.deleteMany({ owner: userId }),
      ActivityLog.deleteMany({ user: userId }),
      Meeting.deleteMany({ host: userId }),
      // Remove user from participant lists in meetings they were part of (but didn't host)
      Meeting.updateMany(
        { participants: { $elemMatch: { user: userId } } },
        { $pull: { participants: { user: userId } } }
      ),
      // Assuming a Notification model exists or might exist later, safe to wrap if it doesn't
      mongoose.models.Notification ? mongoose.models.Notification.deleteMany({ recipient: userId }) : Promise.resolve(),
      User.findByIdAndDelete(userId)
    ];

    await Promise.all(promises);

    // 3. Clear Auth Cookies
    res.cookie('accessToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      expires: new Date(0)
    });

    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      expires: new Date(0)
    });

    res.status(200).json({ success: true, message: "Account successfully deleted." });

  } catch (error) {
    console.error("Delete Account Error:", error.message);
    return res.status(500).json({ message: "Server Error during account deletion." });
  }
};

// @desc    Get current logged in user
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    return res.status(200).json({ user: req.user });
  } catch (error) {
    console.error("Get Me Error:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  updateUserProfile,
  updatePassword,
  getUserActivityLogs,
  getMe,
  deleteAccount,
};  




