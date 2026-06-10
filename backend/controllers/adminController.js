const User = require('../models/User');
const Incident = require('../models/Incident');
const createAuditLog = require('../utils/createAuditLog');

const allowedRoles = ['student', 'teacher', 'security', 'admin'];

function formatUser(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
}

function formatIncident(item) {
    return {
        id: item._id,
        title: item.title,
        description: item.description,
        location: item.location,
        status: item.status,
        responsible: item.responsible,
        date: item.date,
        mapPoint: item.mapPoint,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
    };
}

async function getUsers(req, res) {
    try {
        const users = await User.find()
            .select('-passwordHash -twoFactorCode -twoFactorExpires -twoFactorAttempts -twoFactorLockedUntil')
            .sort({ createdAt: -1 });

        res.status(200).json(users.map(formatUser));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
}

async function updateUserRole(req, res) {
    try {
        const { role } = req.body;

        if (!allowedRoles.includes(role)) {
            await createAuditLog({
                req,
                action: 'ADMIN_UPDATE_ROLE_FAILED',
                entityType: 'user',
                entityId: req.params.id,
                message: `Администратор попытался назначить некорректную роль: ${role}`
            });

            return res.status(400).json({
                message: 'Некорректная роль пользователя'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            });
        }

        const oldRole = user.role;

        user.role = role;
        await user.save();

        await createAuditLog({
            req,
            action: 'UPDATE_USER_ROLE',
            entityType: 'user',
            entityId: user._id,
            message: `Изменена роль пользователя ${user.email}: ${oldRole} → ${user.role}`
        });

        res.status(200).json({
            message: 'Роль пользователя обновлена',
            user: formatUser(user)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
}

async function deleteUser(req, res) {
    try {
        if (String(req.user.id) === String(req.params.id)) {
            await createAuditLog({
                req,
                action: 'ADMIN_SELF_DELETE_BLOCKED',
                entityType: 'user',
                entityId: req.params.id,
                message: 'Заблокирована попытка администратора удалить самого себя'
            });

            return res.status(400).json({
                message: 'Нельзя удалить самого себя'
            });
        }

        const deletedUser = await User.findByIdAndDelete(req.params.id);

        if (!deletedUser) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            });
        }

        await createAuditLog({
            req,
            action: 'DELETE_USER',
            entityType: 'user',
            entityId: deletedUser._id,
            message: `Удалён пользователь: ${deletedUser.email}`
        });

        res.status(200).json({
            message: 'Пользователь удалён'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
}

async function getAdminIncidents(req, res) {
    try {
        const incidents = await Incident.find().sort({ createdAt: -1 });
        res.status(200).json(incidents.map(formatIncident));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
}

async function deleteAdminIncident(req, res) {
    try {
        const deletedIncident = await Incident.findByIdAndDelete(req.params.id);

        if (!deletedIncident) {
            return res.status(404).json({
                message: 'Инцидент не найден'
            });
        }

        await createAuditLog({
            req,
            action: 'ADMIN_DELETE_INCIDENT',
            entityType: 'incident',
            entityId: deletedIncident._id,
            message: `Администратор удалил инцидент: ${deletedIncident.title}`
        });

        res.status(200).json({
            message: 'Инцидент удалён'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
}

module.exports = {
    getUsers,
    updateUserRole,
    deleteUser,
    getAdminIncidents,
    deleteAdminIncident
};