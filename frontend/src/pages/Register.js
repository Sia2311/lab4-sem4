import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import api from '../api/axios';

import '../styles/auth.css';

function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/register', {
                name: name.trim(),
                email: email.trim(),
                password
            });

            localStorage.setItem('pendingRegistrationEmail', response.data.email);

            navigate('/verify-registration-email');
        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Ошибка регистрации'
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="auth-page">

            <div className="auth-box">

                <h1>REGISTER</h1>

                <form onSubmit={handleSubmit}>

                    <div className="auth-group">
                        <label>Имя</label>

                        <input
                            type="text"
                            placeholder="Введите имя"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

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
                            placeholder="Минимум 8 символов, буквы и цифры"
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
                        {isLoading ? 'ОТПРАВКА КОДА...' : 'ЗАРЕГИСТРИРОВАТЬСЯ'}
                    </button>

                </form>

                <div className="auth-link">
                    Уже есть аккаунт? <Link to="/login">Войти</Link>
                </div>

            </div>

        </div>
    );
}

export default Register;