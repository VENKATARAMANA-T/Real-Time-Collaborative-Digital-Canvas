const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || '7d';
const ACCESS_TOKEN_TTL_MS = parseInt(ACCESS_TOKEN_TTL)* 60 * 1000;
const REFRESH_TOKEN_TTL_MS = parseInt(REFRESH_TOKEN_TTL)* 24 * 60 * 60 * 1000;

const getAccessSecret = () => process.env.ACCESS_TOKEN_SECRET;
const getRefreshSecret = () => process.env.REFRESH_TOKEN_SECRET;

const signAccessToken = (userId) => {
  const secret = getAccessSecret();
  if (!secret) {
    throw new Error('ACCESS_TOKEN_SECRET is required');
  }
  return jwt.sign({ id: userId, type: 'access' }, secret, {
    expiresIn: ACCESS_TOKEN_TTL
  });
};

const signRefreshToken = (userId) => {
  const secret = getRefreshSecret();
  if (!secret) {
    throw new Error('REFRESH_TOKEN_SECRET is required');
  }
  return jwt.sign({ id: userId, type: 'refresh' }, secret, {
    expiresIn: REFRESH_TOKEN_TTL
  });
};

const hashToken = async (token) => bcrypt.hash(token, 10);
const compareToken = async (token, hash) => bcrypt.compare(token, hash);

const isProduction = process.env.NODE_ENV === 'production';

const cookieBaseOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite:  isProduction ? 'none' : 'lax',  // 'lax' works on HTTP dev
  path: '/'
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    ...cookieBaseOptions,
    maxAge: ACCESS_TOKEN_TTL_MS
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieBaseOptions,
    maxAge: REFRESH_TOKEN_TTL_MS
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', cookieBaseOptions);
  res.clearCookie('refreshToken', cookieBaseOptions);
};

module.exports = {
  signAccessToken,
  signRefreshToken,
  hashToken,
  compareToken,
  setAuthCookies,
  clearAuthCookies,
  getAccessSecret,
  getRefreshSecret
};
