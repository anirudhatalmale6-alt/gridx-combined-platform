const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const SECRET = process.env.SECRET_KEY || 'gridx-combined-secret-key-2026';
const TOKEN_EXPIRY = '30d'; // 30-day expiry for meter JWT tokens

// POST /meters/getAccessToken — ESP32 meter registration
router.post("/getAccessToken", (req, res) => {
  const DRN = req.body.DRN || req.body.drn;
  if (!DRN) {
    return res.status(400).json({ error: "Missing DRN in request body" });
  }

  // Generate a JWT token for this meter
  const accessToken = jwt.sign(
    { drn: DRN, type: 'meter' },
    SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  console.log('[METER-AUTH] Issued JWT for meter:', DRN);
  return res.json({ accessToken: accessToken });
});

// POST /meters/getAccessTokenWeb — web dashboard meter token
router.post("/getAccessTokenWeb", (req, res) => {
  const DRN = req.body.DRN || req.body.drn;
  if (!DRN) {
    return res.status(400).json({ error: "Missing DRN in request body" });
  }

  const accessToken = jwt.sign(
    { meterDRN: DRN, type: 'meter-web' },
    SECRET,
    { expiresIn: '1h' }
  );

  return res.json({ accessToken: accessToken });
});

// GET /meters/testToken — verify token is valid
router.get("/testToken", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token", details: err.message });
    }
    return res.json({ valid: true, decoded: decoded });
  });
});

module.exports = router;
