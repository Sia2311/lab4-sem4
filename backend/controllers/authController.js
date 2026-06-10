const bcrypt = require('bcryptjs');

const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');

const createToken = require('../utils/createToken');
const createAuditLog = require('../utils/createAuditLog');
const generateTwoFactorCode = require('../utils/generateTwoFactorCode');

const {
    sendTwoFactorCode,
    sendRegistrationVerificationCode
} = require('../utils/mail');

const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function isProduction() {
    return process.env.NODE_ENV === 'production';
}

function getCookieOptions() {
    return {
        httpOnly: true,
        secure: isProduction(),
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000
    };
}

async function register(req, res) {
    try {
        const name = String(req.body.name || '').trim();
        const email = normalizeEmail(req.body.email);
        const password = String(req.body.password || '');

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Заполнены не все обязательные поля'
            });
        }

        if (name.length < 2 || name.length > 80) {
            return res.status(400).json({
                message: 'Имя должно быть от 2 до 80 символов'
            });
        }

        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({
                message: 'Некорректный email'
            });
        }

        if (!PASSWORD_REGEX.test(password)) {
            return res.status(400).json({
                message: 'Пароль должен быть не короче 8 символов и содержать буквы и цифры'
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: 'Пользователь с таким email уже существует'
            });
        }

        const code = generateTwoFactorCode();
        const codeHash = await bcrypt.hash(code, 10);
        const passwordHash = await bcrypt.hash(password, 12);

        await EmailVerification.deleteMany({
            type: 'REGISTER',
            email
        });

        await EmailVerification.create({
            type: 'REGISTER',
            email,
            name,
            passwordHash,
            codeHash,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });

        await sendRegistrationVerificationCode(email, code);

        await createAuditLog({
            req,
            action: 'REGISTER_EMAIL_CODE_SENT',
            entityType: 'auth',
            userEmail: email,
            message: `Код подтверждения регистрации отправлен на ${email}`
        });

        res.status(200).json({
            message: 'Код подтверждения регистрации отправлен на почту',
            email
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Ошибка отправки кода подтверждения регистрации'
        });
    }
}

async function verifyRegistrationEmail(req, res) {
    try {
        const email = normalizeEmail(req.body.email);
        const code = String(req.body.code || '').trim();

        if (!email || !code) {
            return res.status(400).json({
                message: 'Введите email и код подтверждения'
            });
        }

        if (!/^\d{6}$/.test(code)) {
            return res.status(400).json({
                message: 'Код должен состоять из 6 цифр'
            });
        }

        const verification = await EmailVerification.findOne({
            type: 'REGISTER',
            email
        }).sort({ createdAt: -1 });

        if (!verification) {
            return res.status(400).json({
                message: 'Код подтверждения не найден или уже истёк'
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
                action: 'REGISTER_EMAIL_CODE_FAILED',
                entityType: 'auth',
                userEmail: email,
                message: `Неверный код подтверждения регистрации для ${email}`
            });

            return res.status(400).json({
                message: 'Неверный код подтверждения'
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            await EmailVerification.deleteOne({ _id: verification._id });

            return res.status(400).json({
                message: 'Пользователь с таким email уже существует'
            });
        }

        const newUser = await User.create({
            name: verification.name,
            email: verification.email,
            emailVerified: true,
            passwordHash: verification.passwordHash,
            role: 'student'
        });

        await EmailVerification.deleteOne({ _id: verification._id });

        await createAuditLog({
            req,
            action: 'REGISTER_SUCCESS',
            entityType: 'user',
            entityId: newUser._id,
            userId: newUser._id,
            userEmail: newUser.email,
            userRole: newUser.role,
            message: `Пользователь ${newUser.email} подтвердил email и завершил регистрацию`
        });

        res.status(201).json({
            message: 'Email подтверждён. Регистрация завершена.'
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Ошибка подтверждения регистрации'
        });
    }
}

async function login(req, res) {
    try {
        const email = normalizeEmail(req.body.email);
        const password = String(req.body.password || '');

        if (!email || !password) {
            return res.status(400).json({
                message: 'Введите email и пароль'
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            await createAuditLog({
                req,
                action: 'LOGIN_FAILED',
                entityType: 'auth',
                userEmail: email,
                message: `Неудачный вход: пользователь ${email} не найден`
            });

            return res.status(401).json({
                message: 'Неверный email или пароль'
            });
        }

        if (user.emailVerified === false) {
            return res.status(403).json({
                message: 'Email не подтверждён'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            await createAuditLog({
                req,
                action: 'LOGIN_FAILED',
                entityType: 'auth',
                entityId: user._id,
                userId: user._id,
                userEmail: user.email,
                userRole: user.role,
                message: `Неудачный вход: неверный пароль для ${user.email}`
            });

            return res.status(401).json({
                message: 'Неверный email или пароль'
            });
        }

        if (user.twoFactorLockedUntil && user.twoFactorLockedUntil > new Date()) {
            return res.status(429).json({
                message: 'Слишком много неверных попыток. Попробуйте позже.'
            });
        }

        const code = generateTwoFactorCode();
        const codeHash = await bcrypt.hash(code, 10);

        user.twoFactorCode = codeHash;
        user.twoFactorExpires = new Date(Date.now() + 5 * 60 * 1000);
        user.twoFactorAttempts = 0;
        user.twoFactorLockedUntil = null;

        await user.save();

        await sendTwoFactorCode(user.email, code);

        await createAuditLog({
            req,
            action: 'TWO_FACTOR_CODE_SENT',
            entityType: 'auth',
            entityId: user._id,
            userId: user._id,
            userEmail: user.email,
            userRole: user.role,
            message: `Код двухфакторной авторизации отправлен пользователю ${user.email}`
        });

        res.status(200).json({
            message: 'Код подтверждения отправлен на почту',
            twoFactorRequired: true,
            email: user.email
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Ошибка отправки кода подтверждения'
        });
    }
}

async function verifyCode(req, res) {
    try {
        const email = normalizeEmail(req.body.email);
        const code = String(req.body.code || '').trim();

        if (!email || !code) {
            return res.status(400).json({
                message: 'Введите email и код подтверждения'
            });
        }

        if (!/^\d{6}$/.test(code)) {
            return res.status(400).json({
                message: 'Код должен состоять из 6 цифр'
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            });
        }

        if (user.twoFactorLockedUntil && user.twoFactorLockedUntil > new Date()) {
            return res.status(429).json({
                message: 'Слишком много неверных попыток. Попробуйте позже.'
            });
        }

        if (!user.twoFactorCode || !user.twoFactorExpires) {
            return res.status(400).json({
                message: 'Код подтверждения не был создан'
            });
        }

        if (new Date() > user.twoFactorExpires) {
            user.twoFactorCode = null;
            user.twoFactorExpires = null;
            user.twoFactorAttempts = 0;
            user.twoFactorLockedUntil = null;

            await user.save();

            return res.status(400).json({
                message: 'Срок действия кода истёк'
            });
        }

        const isCodeValid = await bcrypt.compare(code, user.twoFactorCode);

        if (!isCodeValid) {
            user.twoFactorAttempts += 1;

            if (user.twoFactorAttempts >= 5) {
                user.twoFactorLockedUntil = new Date(Date.now() + 10 * 60 * 1000);
            }

            await user.save();

            await createAuditLog({
                req,
                action: user.twoFactorAttempts >= 5 ? 'TWO_FACTOR_LOCKED' : 'TWO_FACTOR_FAILED',
                entityType: 'auth',
                entityId: user._id,
                userId: user._id,
                userEmail: user.email,
                userRole: user.role,
                message: `Неверный 2FA-код для ${user.email}. Попытка ${user.twoFactorAttempts} из 5`
            });

            return res.status(400).json({
                message: 'Неверный код подтверждения'
            });
        }

        user.twoFactorCode = null;
        user.twoFactorExpires = null;
        user.twoFactorAttempts = 0;
        user.twoFactorLockedUntil = null;

        await user.save();

        const token = createToken(user);

        res.cookie('accessToken', token, getCookieOptions());

        await createAuditLog({
            req,
            action: 'LOGIN_SUCCESS',
            entityType: 'auth',
            entityId: user._id,
            userId: user._id,
            userEmail: user.email,
            userRole: user.role,
            message: `Пользователь ${user.email} успешно вошёл в систему`
        });

        res.status(200).json({
            message: 'Вход выполнен успешно',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
}

async function logout(req, res) {
    await createAuditLog({
        req,
        action: 'LOGOUT',
        entityType: 'auth',
        message: 'Пользователь вышел из системы'
    });

    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: isProduction(),
        sameSite: 'strict'
    });

    res.status(200).json({
        message: 'Выход выполнен успешно'
    });
}

module.exports = {
    register,
    verifyRegistrationEmail,
    login,
    verifyCode,
    logout
};