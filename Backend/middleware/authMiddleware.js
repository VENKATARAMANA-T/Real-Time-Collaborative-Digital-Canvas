const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getAccessSecret } = require('../utils/tokenService');

const authMiddleware = async (req, res, next) => {
  let token = req.cookies?.accessToken;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const secret = getAccessSecret();
    if (!secret) {
      return res.status(500).json({ message: 'Access secret not configured' });
    }

    const decoded = jwt.verify(token, secret);

    req.user = await User.findById(decoded.id).select('-password');

    return next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { authMiddleware };