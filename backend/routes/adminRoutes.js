const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

const {
    getUsers,
    updateUserRole,
    deleteUser,
    getAdminIncidents,
    deleteAdminIncident
} = require('../controllers/adminController');

const router = express.Router();

router.get('/users', authMiddleware, adminMiddleware, getUsers);
router.patch('/users/:id/role', authMiddleware, adminMiddleware, updateUserRole);
router.delete('/users/:id', authMiddleware, adminMiddleware, deleteUser);

router.get('/incidents', authMiddleware, adminMiddleware, getAdminIncidents);
router.delete('/incidents/:id', authMiddleware, adminMiddleware, deleteAdminIncident);

module.exports = router;