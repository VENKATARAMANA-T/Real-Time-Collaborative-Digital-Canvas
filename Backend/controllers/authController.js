const User = require('../models/User.js');
const ActivityLog = require('../models/ActivityLog.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

    // 7. Generate Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });


    // redirect to login page after registration ********
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
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

    // 3. Generate Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    // 4. Log Success
    const successLog = new ActivityLog({
      user: user._id,
      action: 'LOGIN_SUCCESS',
      ipAddress: req.ip || '127.0.0.1'
    });
    await successLog.save();

    // login successful, redirect to canvas page ********
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};