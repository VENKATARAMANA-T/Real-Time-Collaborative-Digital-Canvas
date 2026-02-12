const User = require('../models/User.js');
const ActivityLog = require('../models/ActivityLog.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');
const {
  signAccessToken,
  signRefreshToken,
  hashToken,
  compareToken,
  setAuthCookies,
  clearAuthCookies,
  getRefreshSecret
} = require('../utils/tokenService');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Check if Email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // 2. Check if Username already exists (New requirement)
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // 3. Hash Password Manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create User Instance (Not saved yet)
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    // 5. Explicitly Save User to Database
    await user.save();

    // 6. Log Activity (Create -> Save)
    const log = new ActivityLog({
      user: user._id,
      action: 'REGISTER_USER',
      ipAddress: req.ip || '127.0.0.1' // Fallback if local
    });
    await log.save();

    // redirect to login page after registration ********
    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate Request
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // 2. Check for user
    const user = await User.findOne({ email }).select('+password');

    // If user not found OR password doesn't match
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Generate Access + Refresh Tokens
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    const refreshTokenHash = await hashToken(refreshToken);

    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    // 4. Log Success
    const successLog = new ActivityLog({
      user: user._id,
      action: 'LOGIN_SUCCESS',
      ipAddress: req.ip || '127.0.0.1'
    });
    await successLog.save();

    // login successful, redirect to canvas page ********
    setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Refresh access token (rotation)
// @route   POST /api/auth/refresh
// @access  Public
exports.refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token missing' });
    }

    const refreshSecret = getRefreshSecret();
    if (!refreshSecret) {
      return res.status(500).json({ message: 'Refresh secret not configured' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, refreshSecret);
    } catch (error) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = await User.findById(decoded.id).select('+refreshTokenHash');

    if (!user || !user.refreshTokenHash) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Refresh token not recognized' });
    }

    const isValid = await compareToken(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Refresh token invalid' });
    }

    const newAccessToken = signAccessToken(user._id);
    const newRefreshToken = signRefreshToken(user._id);
    user.refreshTokenHash = await hashToken(newRefreshToken);
    await user.save();

    setAuthCookies(res, newAccessToken, newRefreshToken);

    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
exports.logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const refreshSecret = getRefreshSecret();

    if (refreshToken && refreshSecret) {
      try {
        const decoded = jwt.verify(refreshToken, refreshSecret);
        const user = await User.findById(decoded.id).select('+refreshTokenHash');
        if (user) {
          user.refreshTokenHash = null;
          await user.save();
        }
      } catch (error) {
        // Ignore invalid/expired refresh tokens during logout
      }
    }

    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: 'User logged out successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Invalid email address' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordTokenHash = resetTokenHash;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    const subject = 'Password Reset Request';
    const text = `Use the following link to reset your password: ${resetLink}`;
    const html = `<p>Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`;

    await sendEmail({ to: user.email, subject, text, html });

    res.status(200).json({ message: 'Reset link sent to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordTokenHash: resetTokenHash,
      resetPasswordExpire: { $gt: new Date() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpire = undefined;
    user.refreshTokenHash = null;

    await user.save();

    clearAuthCookies(res);

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server Error' });
  }
};