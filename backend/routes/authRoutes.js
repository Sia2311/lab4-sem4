const express = require('express');
const rateLimit = require('express-rate-limit');

const authMiddleware = require('../middlewares/authMiddleware');

const {
    register,
    login,
    verifyCode,
    logout
} = require('../controllers/authController');

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Слишком много попыток. Попробуйте позже.'
    }
});

const verifyCodeLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Слишком много попыток ввода кода. Попробуйте позже.'
    }
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-code', verifyCodeLimiter, verifyCode);
router.post('/logout', authMiddleware, logout);

module.exports = router;