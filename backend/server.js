const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const DB_FILE = './db.json';
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

async function readDb() {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data);
}

async function writeDb(data) {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

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
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Заполнены не все обязательные поля' });
        }

        const db = await readDb();

        const existingUser = db.users.find(user => user.email === email);

        if (existingUser) {
            return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            passwordHash,
            role: role || 'user',
            createdAt: new Date().toISOString()
        };

        db.users.push(newUser);
        await writeDb(db);

        res.status(201).json({
            message: 'Пользователь успешно зарегистрирован',
            user: {
                id: newUser.id,
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
            return res.status(400).json({ message: 'Введите email и пароль' });
        }

        const db = await readDb();

        const user = db.users.find(user => user.email === email);

        if (!user) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Неверный email или пароль' });
        }

        const token = jwt.sign(
            {
                id: user.id,
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
                id: user.id,
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
        const db = await readDb();

        const user = db.users.find(user => user.id === req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// GET — получение списка инцидентов
app.get('/api/incidents', async (req, res) => {
    try {
        const db = await readDb();
        res.status(200).json(db.incidents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// GET — получение одного инцидента
app.get('/api/incidents/:id', async (req, res) => {
    try {
        const db = await readDb();
        const incident = db.incidents.find(item => item.id === req.params.id);

        if (!incident) {
            return res.status(404).json({ message: 'Инцидент не найден' });
        }

        res.status(200).json(incident);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// POST — создание инцидента
app.post('/api/incidents', authMiddleware, async (req, res) => {
    try {
        /*return res.status(403).json({
            message: 'Доступ запрещён'
        });*/
        const { title, description, location, status, responsible, date } = req.body;

        if (!title || !description || !location || !status || !responsible || !date) {
            return res.status(400).json({ message: 'Заполнены не все обязательные поля' });
        }

        const db = await readDb();

        const newIncident = {
            id: Date.now().toString(),
            title,
            description,
            location,
            status,
            responsible,
            date,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        db.incidents.push(newIncident);
        await writeDb(db);

        res.status(201).json({
            message: 'Инцидент успешно создан',
            incident: newIncident
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// PUT — изменение инцидента
app.put('/api/incidents/:id', async (req, res) => {
    try {
        const db = await readDb();
        const index = db.incidents.findIndex(item => item.id === req.params.id);

        if (index === -1) {
            return res.status(404).json({ message: 'Инцидент не найден' });
        }

        db.incidents[index] = {
            ...db.incidents[index],
            ...req.body,
            updatedAt: new Date().toISOString()
        };

        await writeDb(db);

        res.status(200).json({
            message: 'Инцидент успешно обновлён',
            incident: db.incidents[index]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// DELETE — удаление инцидента
app.delete('/api/incidents/:id', async (req, res) => {
    try {
        const db = await readDb();
        const incident = db.incidents.find(item => item.id === req.params.id);

        if (!incident) {
            return res.status(404).json({ message: 'Инцидент не найден' });
        }

        db.incidents = db.incidents.filter(item => item.id !== req.params.id);
        await writeDb(db);

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