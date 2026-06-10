const bcrypt = require('bcryptjs');
const User = require('../models/User');

const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

async function getProfile(req, res) {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            });
        }

        res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
}

async function updateProfile(req, res) {
    try {
        const name = String(req.body.name || '').trim();
        const email = normalizeEmail(req.body.email);
        const password = String(req.body.password || '');
        const currentPassword = String(req.body.currentPassword || '');

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            });
        }

        const wantsToChangeEmail = email && email !== user.email;
        const wantsToChangePassword = Boolean(password);

        if (name) {
            if (name.length < 2 || name.length > 80) {
                return res.status(400).json({
                    message: 'Имя должно быть от 2 до 80 символов'
                });
            }

            user.name = name;
        }

        if (wantsToChangeEmail || wantsToChangePassword) {
            if (!currentPassword) {
                return res.status(400).json({
                    message: 'Для смены email или пароля введите текущий пароль'
                });
            }

            const isCurrentPasswordValid = await bcrypt.compare(
                currentPassword,
                user.passwordHash
            );

            if (!isCurrentPasswordValid) {
                return res.status(401).json({
                    message: 'Текущий пароль указан неверно'
                });
            }
        }

        if (wantsToChangeEmail) {
            if (!EMAIL_REGEX.test(email)) {
                return res.status(400).json({
                    message: 'Некорректный email'
                });
            }

            const existingUser = await User.findOne({ email });

            if (existingUser && String(existingUser._id) !== String(user._id)) {
                return res.status(400).json({
                    message: 'Этот email уже используется'
                });
            }

            user.email = email;
        }

        if (wantsToChangePassword) {
            if (!PASSWORD_REGEX.test(password)) {
                return res.status(400).json({
                    message: 'Новый пароль должен быть не короче 8 символов и содержать буквы и цифры'
                });
            }

            user.passwordHash = await bcrypt.hash(password, 12);
        }

        await user.save();

        res.status(200).json({
            message: 'Профиль обновлён'
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
}

module.exports = {
    getProfile,
    updateProfile
};