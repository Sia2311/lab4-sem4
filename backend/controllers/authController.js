const bcrypt = require('bcryptjs');
const User = require('../models/User');
const createToken = require('../utils/createToken');
const generateTwoFactorCode = require('../utils/generateTwoFactorCode');
const { sendTwoFactorCode } = require('../utils/mail');

async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Заполнены не все обязательные поля'
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: 'Пользователь с таким email уже существует'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            passwordHash,
            role: 'student'
        });

        res.status(201).json({
            message: 'Пользователь успешно зарегистрирован',
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Введите email и пароль'
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: 'Неверный email или пароль'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Неверный email или пароль'
            });
        }

        const code = generateTwoFactorCode();

        user.twoFactorCode = code;
        user.twoFactorExpires = new Date(Date.now() + 5 * 60 * 1000);

        await user.save();

        await sendTwoFactorCode(user.email, code);

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
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                message: 'Введите email и код подтверждения'
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден'
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

            await user.save();

            return res.status(400).json({
                message: 'Срок действия кода истёк'
            });
        }

        if (user.twoFactorCode !== code) {
            return res.status(400).json({
                message: 'Неверный код подтверждения'
            });
        }

        user.twoFactorCode = null;
        user.twoFactorExpires = null;

        await user.save();

        const token = createToken(user);

        res.status(200).json({
            message: 'Вход выполнен успешно',
            token,
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

module.exports = {
    register,
    login,
    verifyCode
};