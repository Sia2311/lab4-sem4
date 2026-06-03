const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

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

module.exports = authMiddleware;