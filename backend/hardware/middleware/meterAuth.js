const jwt = require("jsonwebtoken");
require("dotenv").config();

const SECRET = process.env.SECRET_KEY || 'gridx-combined-secret-key-2026';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token || token.length < 10) {
    // No token — allow request but flag as unauthenticated
    // (meters may be registering or have an expired token)
    req.meterAuth = false;
    return next();
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.meterAuth = true;
    req.meterDRN = decoded.drn || decoded.meterDRN;
    req.DRN = decoded.drn || decoded.meterDRN;
  } catch (err) {
    // Token invalid or expired — still process the request
    // but the response will include a refreshed token
    req.meterAuth = false;
    req.tokenExpired = err.name === 'TokenExpiredError';
  }

  return next();
};

module.exports = verifyToken;
