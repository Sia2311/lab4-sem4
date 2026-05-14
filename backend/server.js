const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lab4_incidents';

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
    });

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    passwordHash: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    twoFactorCode: {
        type: String,
        default: null
    },

    twoFactorExpires: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

const incidentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    location: {
        type: String,
        required: true
    },

    status: {
        type: String,
        required: true,
        default: 'OPEN'
    },

    responsible: {
        type: String,
        required: true
    },

    date: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);
const Incident = mongoose.model('Incident', incidentSchema);

function createToken(user) {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

function generateTwoFactorCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

const mailTransporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
    }
});

async function sendTwoFactorCode(email, code) {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
        throw new Error('Не настроены данные почты в .env');
    }

    await mailTransporter.sendMail({
        from: `"Система инцидентов" <${process.env.MAIL_USER}>`,
        to: email,
        subject: 'Код подтверждения входа',
        text: `Ваш код подтверждения: ${code}. Код действует 5 минут.`,
        html: `
            <div style="font-family: Arial, sans-serif;">
                <h2>Код подтверждения входа</h2>
                <p>Ваш код:</p>
                <h1 style="letter-spacing: 4px;">${code}</h1>
                <p>Код действует 5 минут.</p>
            </div>
        `
    });
}

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: 'Токен отсутствует'
        });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            message: 'Токен отсутствует'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Недействительный токен'
        });
    }
}

function adminMiddleware(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            message: 'Доступ разрешён только администратору'
        });
    }

    next();
}

app.get('/', (req, res) => {
    res.json({
        message: 'REST API работает'
    });
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Заполнены не все обязательные поля'
            });
        }

        const existingUser = await User.findOne({
            email
        });

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
            role: 'user'
        });

        res.status(201).json({
            message: 'Пользователь успешно зарегистрирован. Доступ к панели выдаётся администратором.',
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
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Введите email и пароль'
            });
        }

        const user = await User.findOne({
            email
        });

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

        if (user.role !== 'admin') {
            return res.status(403).json({
                message: 'Доступ разрешён только администратору'
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
});

app.post('/api/auth/verify-code', async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                message: 'Введите email и код подтверждения'
            });
        }

        const user = await User.findOne({
            email
        });

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
});

app.get('/api/profile', authMiddleware, async (req, res) => {
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
});

app.put('/api/profile', authMiddleware, async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден'
            });
        }

        if (name) {
            user.name = name;
        }

        if (email) {
            user.email = email;
        }

        if (password) {
            user.passwordHash = await bcrypt.hash(password, 10);
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
});

app.get('/api/incidents', async (req, res) => {
    try {
        const incidents = await Incident.find().sort({
            createdAt: -1
        });

        res.status(200).json(
            incidents.map(item => ({
                id: item._id,
                title: item.title,
                description: item.description,
                location: item.location,
                status: item.status,
                responsible: item.responsible,
                date: item.date,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            }))
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
});

app.get('/api/incidents/:id', async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id);

        if (!incident) {
            return res.status(404).json({
                message: 'Инцидент не найден'
            });
        }

        res.status(200).json({
            id: incident._id,
            title: incident.title,
            description: incident.description,
            location: incident.location,
            status: incident.status,
            responsible: incident.responsible,
            date: incident.date,
            createdAt: incident.createdAt,
            updatedAt: incident.updatedAt
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
});

app.post('/api/incidents', authMiddleware, async (req, res) => {
    try {
        const { title, description, location, status, responsible, date } = req.body;

        if (!title || !description || !location || !status || !responsible || !date) {
            return res.status(400).json({
                message: 'Заполнены не все обязательные поля'
            });
        }

        const newIncident = await Incident.create({
            title,
            description,
            location,
            status,
            responsible,
            date
        });

        res.status(201).json({
            message: 'Инцидент успешно создан',
            incident: {
                id: newIncident._id,
                title: newIncident.title,
                description: newIncident.description,
                location: newIncident.location,
                status: newIncident.status,
                responsible: newIncident.responsible,
                date: newIncident.date,
                createdAt: newIncident.createdAt,
                updatedAt: newIncident.updatedAt
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
});

app.put('/api/incidents/:id', authMiddleware, async (req, res) => {
    try {
        const updatedIncident = await Incident.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedIncident) {
            return res.status(404).json({
                message: 'Инцидент не найден'
            });
        }

        res.status(200).json({
            message: 'Инцидент успешно обновлён',
            incident: {
                id: updatedIncident._id,
                title: updatedIncident.title,
                description: updatedIncident.description,
                location: updatedIncident.location,
                status: updatedIncident.status,
                responsible: updatedIncident.responsible,
                date: updatedIncident.date,
                createdAt: updatedIncident.createdAt,
                updatedAt: updatedIncident.updatedAt
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
});

app.delete('/api/incidents/:id', authMiddleware, async (req, res) => {
    try {
        const deletedIncident = await Incident.findByIdAndDelete(req.params.id);

        if (!deletedIncident) {
            return res.status(404).json({
                message: 'Инцидент не найден'
            });
        }

        res.status(200).json({
            message: 'Инцидент успешно удалён'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
});

app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find()
            .select('-passwordHash -twoFactorCode -twoFactorExpires')
            .sort({
                createdAt: -1
            });

        res.status(200).json(
            users.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }))
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
});

app.patch('/api/admin/users/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
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

        user.role = role;

        await user.save();

        res.status(200).json({
            message: 'Роль пользователя обновлена',
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
});

app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        if (String(req.user.id) === String(req.params.id)) {
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

        res.status(200).json({
            message: 'Пользователь удалён'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
});

app.get('/api/admin/incidents', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const incidents = await Incident.find().sort({
            createdAt: -1
        });

        res.status(200).json(
            incidents.map(item => ({
                id: item._id,
                title: item.title,
                description: item.description,
                location: item.location,
                status: item.status,
                responsible: item.responsible,
                date: item.date,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            }))
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
});

app.delete('/api/admin/incidents/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const deletedIncident = await Incident.findByIdAndDelete(req.params.id);

        if (!deletedIncident) {
            return res.status(404).json({
                message: 'Инцидент не найден'
            });
        }

        res.status(200).json({
            message: 'Инцидент удалён'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Ошибка сервера'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});