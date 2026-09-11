const express = require('express');
const { register, login, logout, me } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { createSimpleRateLimit } = require('../middleware/rateLimitMiddleware');

const router = express.Router();
const authRateLimit = createSimpleRateLimit({ windowMs: 60 * 1000, max: 20 });

router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.post('/logout', authRateLimit, authMiddleware, logout);
router.get('/me', authRateLimit, authMiddleware, me);

module.exports = router;
