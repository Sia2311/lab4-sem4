import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import api from '../api/axios';

import '../styles/auth.css';

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/login', {
                email: email.trim(),
                password
            });

            if (response.data.twoFactorRequired) {
                localStorage.setItem('pendingEmail', response.data.email);
                navigate('/verify-code');
                return;
            }

            setError('Неожиданный ответ сервера');
        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Ошибка входа'
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-box">

                <h1>LOGIN</h1>

                <form onSubmit={handleSubmit}>

                    <div className="auth-group">
                        <label>Email</label>

                        <input
                            type="email"
                            placeholder="Введите email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-group">
                        <label>Пароль</label>

                        <input
                            type="password"
                            placeholder="Введите пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="auth-error">
                            {error}
                        </div>
                    )}

                    <button
                        className="auth-btn"
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'ОТПРАВКА КОДА...' : 'ВОЙТИ'}
                    </button>

                </form>

                <div className="auth-link">
                    Нет аккаунта? <Link to="/register">Регистрация</Link>
                </div>

            </div>
        </div>
    );
}

export default Login;