const nodemailer = require('nodemailer');

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

module.exports = {
    sendTwoFactorCode
};