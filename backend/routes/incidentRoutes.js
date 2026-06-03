const express = require('express');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const {
    getIncidents,
    getIncidentById,
    createIncident,
    updateIncident,
    deleteIncident
} = require('../controllers/incidentController');

const router = express.Router();

router.get(
    '/',
    authMiddleware,
    roleMiddleware('student', 'teacher', 'security', 'admin'),
    getIncidents
);

router.get(
    '/:id',
    authMiddleware,
    roleMiddleware('student', 'teacher', 'security', 'admin'),
    getIncidentById
);

router.post(
    '/',
    authMiddleware,
    roleMiddleware('student', 'teacher', 'security', 'admin'),
    createIncident
);

router.put(
    '/:id',
    authMiddleware,
    roleMiddleware('security', 'admin'),
    updateIncident
);

router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware('admin'),
    deleteIncident
);

module.exports = router;