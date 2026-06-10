const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');

const {
    getProfile,
    updateProfile,
    confirmEmailChange
} = require('../controllers/profileController');

const router = express.Router();

router.get('/', authMiddleware, getProfile);
router.put('/', authMiddleware, updateProfile);
router.post('/confirm-email-change', authMiddleware, confirmEmailChange);

module.exports = router;