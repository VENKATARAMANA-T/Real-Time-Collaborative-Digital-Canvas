const User = require('../models/User.js');
const ActivityLog = require('../models/ActivityLog.js');
const Folder = require('../models/Folder.js');
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

    // Validate required fields for traditional registration
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // 1. Check if Email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      // If existing user is unverified and activation expired, delete and allow re-register
      if (!emailExists.isVerified && emailExists.activationTokenExpire && emailExists.activationTokenExpire < new Date()) {
        await User.deleteOne({ _id: emailExists._id });
        await Folder.deleteMany({ owner: emailExists._id });
        await ActivityLog.deleteMany({ user: emailExists._id });
      } else {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // 2. Check if Username already exists (New requirement)
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // 3. Hash Password Manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Generate activation token
    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationTokenHash = crypto.createHash('sha256').update(activationToken).digest('hex');

    // 5. Create User Instance with isVerified = false
    const user = new User({
      username,
      email,
      password: hashedPassword,
      isVerified: false,
      activationTokenHash,
      activationTokenExpire: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });

    // 6. Explicitly Save User to Database
    await user.save();

    // 7. Log Activity (Create -> Save)
    const log = new ActivityLog({
      user: user._id,
      action: 'REGISTER_USER',
    });
    await log.save();

    // 8. Create default "Personal Sketches" folder for the new user
    try {
      await Folder.create({
        name: 'Personal Sketches',
        owner: user._id,
        isDefault: true
      });
    } catch (folderErr) {
      console.warn('[Register] Failed to create default folder:', folderErr.message);
    }

    // 9. Send activation email
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const activationLink = `${baseUrl}/activate/${activationToken}`;

    const subject = 'Activate Your CollabCanvas Account';
    const text = `Welcome to CollabCanvas! Please activate your account by clicking the following link: ${activationLink}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0;">
          <h1 style="color: #7c3aed; margin: 0;">CollabCanvas</h1>
        </div>
        <div style="background: #1e293b; border-radius: 12px; padding: 32px; color: #e2e8f0;">
          <h2 style="color: #ffffff; margin-top: 0;">Welcome, ${username}! 🎨</h2>
          <p style="color: #94a3b8; line-height: 1.6;">
            Thank you for signing up for CollabCanvas. To complete your registration and start collaborating, please activate your account by clicking the button below.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${activationLink}" 
               style="background: #7c3aed; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
              Activate My Account
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${activationLink}" style="color: #7c3aed; word-break: break-all;">${activationLink}</a>
          </p>
          <p style="color: #64748b; font-size: 14px;">
            This link will expire in 5 minutes.
          </p>
        </div>
        <div style="text-align: center; padding: 20px 0; color: #64748b; font-size: 12px;">
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
      </div>
    `;

    await sendEmail({ to: email, subject, text, html });

    res.status(201).json({
      success: true,
      needsActivation: true,
      message: `Activation link has been sent to ${email}. Please check your email to activate your account.`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Activate user account via email link
// @route   GET /api/auth/activate/:token
// @access  Public
exports.activateAccount = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: 'Activation token is required' });
    }

    const activationTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // First check if token exists at all (even if expired)
    const user = await User.findOne({ activationTokenHash });

    if (!user) {
      return res.status(400).json({ message: 'Invalid activation link. Please register again.', expired: false });
    }

    // Check if the link has expired
    if (user.activationTokenExpire && user.activationTokenExpire < new Date()) {
      // Clean up: delete unverified user whose link expired
      if (!user.isVerified) {
        const Folder = require('../models/Folder.js');
        await Folder.deleteMany({ owner: user._id });
        await ActivityLog.deleteMany({ user: user._id });
        await User.deleteOne({ _id: user._id });
      }
      return res.status(410).json({ message: 'This activation link has expired. Please register again.', expired: true });
    }

    // If already verified, still show success until the link expires
    if (user.isVerified) {
      return res.status(200).json({ success: true, message: 'Your account has been activated successfully! You can now login.' });
    }

    // Activate the user — keep token so link works until expiry
    user.isVerified = true;
    await user.save();

    // Log activation activity
    const log = new ActivityLog({
      user: user._id,
      action: 'ACCOUNT_ACTIVATED',
    });
    await log.save();

    res.status(200).json({
      success: true,
      message: 'Your account has been activated successfully! You can now login.'
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

    // If user not found
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Block unverified users from logging in
    if (!user.isVerified) {
      return res.status(401).json({ message: 'Your account is not yet activated. Please check your email for the activation link.' });
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
        profileImage: user.profileImage || '',
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
          // Log logout activity before clearing session
          const log = await ActivityLog.create({ user: user._id, action: 'LOGOUT' });
          if (req.app && req.app.get('io')) {
            req.app.get('io').to(user._id.toString()).emit('activity_update', { userId: user._id, log });
          }
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

