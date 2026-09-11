const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, logout, me } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();
const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again soon.' },
});

router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.post('/logout', authRateLimit, authMiddleware, logout);
router.get('/me', authRateLimit, authMiddleware, me);

module.exports = router;
