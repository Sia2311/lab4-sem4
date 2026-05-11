const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
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
        default: 'user'
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

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Токен отсутствует' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Токен отсутствует' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Недействительный токен' });
    }
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
        res.status(500).json({ message: 'Ошибка сервера' });
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

        if (user.role !== 'admin') {
            return res.status(403).json({
                message: 'Доступ разрешён только администратору'
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

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
        res.status(500).json({ message: 'Ошибка сервера' });
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
        res.status(500).json({ message: 'Ошибка сервера' });
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
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

app.get('/api/incidents', async (req, res) => {
    try {
        const incidents = await Incident.find().sort({ createdAt: -1 });

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
        res.status(500).json({ message: 'Ошибка сервера' });
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
        res.status(500).json({ message: 'Ошибка сервера' });
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
        res.status(500).json({ message: 'Ошибка сервера' });
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
        res.status(500).json({ message: 'Ошибка сервера' });
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
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});