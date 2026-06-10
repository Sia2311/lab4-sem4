const bcrypt = require('bcryptjs');

const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');

const createAuditLog = require('../utils/createAuditLog');
const generateTwoFactorCode = require('../utils/generateTwoFactorCode');

const {
    sendEmailChangeVerificationCode
} = require('../utils/mail');

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

        const pendingEmailVerification = await EmailVerification.findOne({
            type: 'CHANGE_EMAIL',
            userId: user._id
        }).sort({ createdAt: -1 });

        res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            pendingNewEmail: pendingEmailVerification?.newEmail || null
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

        const oldName = user.name;
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
                await createAuditLog({
                    req,
                    action: 'PROFILE_UPDATE_FAILED',
                    entityType: 'user',
                    entityId: user._id,
                    userId: user._id,
                    userEmail: user.email,
                    userRole: user.role,
                    message: `Неудачное обновление профиля ${user.email}: неверный текущий пароль`
                });

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

            const code = generateTwoFactorCode();
            const codeHash = await bcrypt.hash(code, 10);

            await EmailVerification.deleteMany({
                type: 'CHANGE_EMAIL',
                userId: user._id
            });

            await EmailVerification.create({
                type: 'CHANGE_EMAIL',
                email: user.email,
                newEmail: email,
                userId: user._id,
                codeHash,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000)
            });

            await sendEmailChangeVerificationCode(email, code);

            await createAuditLog({
                req,
                action: 'PROFILE_EMAIL_CHANGE_CODE_SENT',
                entityType: 'user',
                entityId: user._id,
                userId: user._id,
                userEmail: user.email,
                userRole: user.role,
                message: `Код подтверждения смены email отправлен на ${email}`
            });
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

        if (oldName !== user.name) {
            await createAuditLog({
                req,
                action: 'PROFILE_NAME_CHANGED',
                entityType: 'user',
                entityId: user._id,
                userId: user._id,
                userEmail: user.email,
                userRole: user.role,
                message: `Пользователь ${user.email} изменил имя: "${oldName}" → "${user.name}"`
            });
        }

        if (wantsToChangePassword) {
            await createAuditLog({
                req,
                action: 'PROFILE_PASSWORD_CHANGED',
                entityType: 'user',
                entityId: user._id,
                userId: user._id,
                userEmail: user.email,
                userRole: user.role,
                message: `Пользователь ${user.email} изменил пароль`
            });
        }

        res.status(200).json({
            message: wantsToChangeEmail
                ? 'Профиль обновлён. Код подтверждения нового email отправлен на почту.'
                : 'Профиль обновлён'
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
}

async function confirmEmailChange(req, res) {
    try {
        const code = String(req.body.code || '').trim();

        if (!/^\d{6}$/.test(code)) {
            return res.status(400).json({
                message: 'Код должен состоять из 6 цифр'
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            });
        }

        const verification = await EmailVerification.findOne({
            type: 'CHANGE_EMAIL',
            userId: user._id
        }).sort({ createdAt: -1 });

        if (!verification) {
            return res.status(400).json({
                message: 'Заявка на смену email не найдена или уже истекла'
            });
        }

        if (verification.lockedUntil && verification.lockedUntil > new Date()) {
            return res.status(429).json({
                message: 'Слишком много неверных попыток. Попробуйте позже.'
            });
        }

        if (new Date() > verification.expiresAt) {
            await EmailVerification.deleteOne({ _id: verification._id });

            return res.status(400).json({
                message: 'Срок действия кода истёк'
            });
        }

        const isCodeValid = await bcrypt.compare(code, verification.codeHash);

        if (!isCodeValid) {
            verification.attempts += 1;

            if (verification.attempts >= 5) {
                verification.lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
            }

            await verification.save();

            await createAuditLog({
                req,
                action: 'PROFILE_EMAIL_CHANGE_CODE_FAILED',
                entityType: 'user',
                entityId: user._id,
                userId: user._id,
                userEmail: user.email,
                userRole: user.role,
                message: `Неверный код подтверждения смены email для ${user.email}`
            });

            return res.status(400).json({
                message: 'Неверный код подтверждения'
            });
        }

        const existingUser = await User.findOne({
            email: verification.newEmail
        });

        if (existingUser && String(existingUser._id) !== String(user._id)) {
            await EmailVerification.deleteOne({ _id: verification._id });

            return res.status(400).json({
                message: 'Этот email уже используется'
            });
        }

        const oldEmail = user.email;

        user.email = verification.newEmail;
        user.emailVerified = true;

        await user.save();

        await EmailVerification.deleteOne({ _id: verification._id });

        await createAuditLog({
            req,
            action: 'PROFILE_EMAIL_CHANGED',
            entityType: 'user',
            entityId: user._id,
            userId: user._id,
            userEmail: user.email,
            userRole: user.role,
            message: `Пользователь изменил email: ${oldEmail} → ${user.email}`
        });

        res.status(200).json({
            message: 'Новый email подтверждён и сохранён',
            email: user.email
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Ошибка подтверждения email'
        });
    }
}

module.exports = {
    getProfile,
    updateProfile,
    confirmEmailChange
};