const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET не задан в .env');
}

function authMiddleware(req, res, next) {
    try {
        let token = req.cookies?.accessToken;

        const authHeader = req.headers.authorization;

        if (!token && authHeader && authHeader.startsWith('Bearer ')) {
            const headerToken = authHeader.split(' ')[1];

            if (headerToken && headerToken !== 'null' && headerToken !== 'undefined') {
                token = headerToken;
            }
        }

        if (!token) {
            return res.status(401).json({
                message: 'Пользователь не авторизован'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = {
            id: decoded.id,
            role: decoded.role
        };

        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Недействительный или просроченный токен'
        });
    }
}

module.exports = authMiddleware;