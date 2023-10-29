const jwt = require('jsonwebtoken');
const config = require('../config/config');

module.exports = async (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided' });
  }

  try {
    const decoded = jwt.verify(token, config.secretKey);
    req.user = decoded.user;
    next();
  } catch (ex) {
    res.status(400).json({ error: 'Invalid token' });
  }
};
