import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import api from '../api/axios';

import '../styles/auth.css';

function VerifyCode() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const pendingEmail = localStorage.getItem('pendingEmail');

        if (!pendingEmail) {
            navigate('/login');
            return;
        }

        setEmail(pendingEmail);
    }, [navigate]);

    async function handleSubmit(e) {
        e.preventDefault();

        setError('');
        setIsLoading(true);

        try {
            await api.post('/auth/verify-code', {
                email,
                code: code.trim()
            });

            localStorage.removeItem('pendingEmail');

            navigate('/dashboard');
        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Ошибка подтверждения кода'
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-box">

                <h1>2FA</h1>

                <p className="auth-text">
                    Код подтверждения отправлен на почту:
                    <br />
                    <strong>{email}</strong>
                </p>

                <form onSubmit={handleSubmit}>

                    <div className="auth-group">
                        <label>Код подтверждения</label>

                        <input
                            type="text"
                            placeholder="Введите 6-значный код"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            maxLength="6"
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
                        {isLoading ? 'ПРОВЕРКА...' : 'ПОДТВЕРДИТЬ'}
                    </button>

                </form>

                <div className="auth-link">
                    <Link to="/login">Вернуться ко входу</Link>
                </div>

            </div>
        </div>
    );
}

export default VerifyCode;