function roleMiddleware(...allowedRoles) {
    return function (req, res, next) {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Недостаточно прав для выполнения действия'
            });
        }

        next();
    };
}

module.exports = roleMiddleware;