const express = require('express');

const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

const {
    getAuditLogs
} = require('../controllers/auditController');

const router = express.Router();

router.get('/', authMiddleware, adminMiddleware, getAuditLogs);

module.exports = router;