const jwt = require('jsonwebtoken');

function createToken(user) {
    const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        {
            expiresIn: '1h'
        }
    );
}

module.exports = createToken;