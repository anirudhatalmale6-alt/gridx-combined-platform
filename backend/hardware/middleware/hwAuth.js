const jwt = require("jsonwebtoken");
require("dotenv").config();

const config = process.env;

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).send({err:535});
  }
  try {
    const secret = config.ACCESS_TOKEN_SECRET || config.SECRET_KEY;
    const decoded = jwt.verify(token, secret);
    req.DRN = decoded.meterDRN || decoded.drn;
  } catch (err) {
    return res.status(401).send({err:535});
  }
  return next();
};

module.exports = verifyToken;
