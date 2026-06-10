import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api/axios';

import '../styles/profile.css';

function Profile() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);

    const [isEditing, setIsEditing] = useState(false);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');

    const [pendingNewEmail, setPendingNewEmail] = useState(null);
    const [emailChangeCode, setEmailChangeCode] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        try {
            const response = await api.get('/profile');

            setUser(response.data);

            setName(response.data.name);
            setEmail(response.data.email);
            setPendingNewEmail(response.data.pendingNewEmail || null);

        } catch (error) {
            console.error(error);

            alert(
                error.response?.data?.message ||
                'Ошибка загрузки профиля'
            );
        }
    }

    async function updateProfile() {
        try {
            const response = await api.put('/profile', {
                name,
                email,
                password,
                currentPassword
            });

            alert(response.data.message || 'Профиль обновлён');

            setPassword('');
            setCurrentPassword('');
            setIsEditing(false);

            fetchProfile();

        } catch (error) {
            console.error(error);

            alert(
                error.response?.data?.message ||
                'Ошибка обновления профиля'
            );
        }
    }

    async function confirmEmailChange() {
        try {
            const response = await api.post('/profile/confirm-email-change', {
                code: emailChangeCode.trim()
            });

            alert(response.data.message || 'Email подтверждён');

            setEmailChangeCode('');
            setPendingNewEmail(null);

            fetchProfile();

        } catch (error) {
            console.error(error);

            alert(
                error.response?.data?.message ||
                'Ошибка подтверждения email'
            );
        }
    }

    if (!user) {
        return (
            <div className="profile-page">
                Загрузка...
            </div>
        );
    }

    return (
        <div className="profile-page">

            <header className="profile-topbar">

                <div>
                    <div className="profile-logo">
                        Безопасность образовательных учреждений
                    </div>

                    <div className="profile-topbar-subtitle">
                        Система мониторинга инцидентов безопасности
                    </div>
                </div>

                <div className="profile-topbar-actions">

                    <button onClick={() => navigate('/dashboard')}>
                        Инциденты
                    </button>

                </div>

            </header>

            <main className="profile-content">

                <div className="profile-card">

                    <h1>Профиль пользователя</h1>

                    <p className="profile-subtitle">
                        Информация об авторизованном пользователе системы
                    </p>

                    <div className="profile-info">

                        <div className="profile-row">

                            <span>Имя</span>

                            {isEditing ? (
                                <input
                                    value={name}
                                    onChange={(e) =>
                                        setName(e.target.value)
                                    }
                                />
                            ) : (
                                <strong>{user.name}</strong>
                            )}

                        </div>

                        <div className="profile-row">

                            <span>Email</span>

                            {isEditing ? (
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                />
                            ) : (
                                <strong>{user.email}</strong>
                            )}

                        </div>

                        <div className="profile-row">

                            <span>Роль</span>

                            <strong className="role-badge">
                                {user.role}
                            </strong>

                        </div>

                        {isEditing && (
                            <>
                                <div className="profile-row">

                                    <span>Новый пароль</span>

                                    <input
                                        type="password"
                                        placeholder="Оставьте пустым, если не меняете"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                    />

                                </div>

                                <div className="profile-row">

                                    <span>Текущий пароль</span>

                                    <input
                                        type="password"
                                        placeholder="Нужен для смены email или пароля"
                                        value={currentPassword}
                                        onChange={(e) =>
                                            setCurrentPassword(e.target.value)
                                        }
                                    />

                                </div>
                            </>
                        )}

                    </div>

                    <div className="profile-actions">

                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)}>
                                Редактировать профиль
                            </button>
                        ) : (
                            <>
                                <button onClick={updateProfile}>
                                    Сохранить
                                </button>

                                <button
                                    className="cancel-btn"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setPassword('');
                                        setCurrentPassword('');
                                        setName(user.name);
                                        setEmail(user.email);
                                    }}
                                >
                                    Отмена
                                </button>
                            </>
                        )}

                    </div>

                    {pendingNewEmail && (
                        <div className="profile-info" style={{ marginTop: '25px' }}>

                            <h2>Подтверждение нового email</h2>

                            <p>
                                Код отправлен на новый email:
                                <br />
                                <strong>{pendingNewEmail}</strong>
                            </p>

                            <div className="profile-row">
                                <span>Код</span>

                                <input
                                    type="text"
                                    placeholder="Введите 6-значный код"
                                    value={emailChangeCode}
                                    maxLength="6"
                                    onChange={(e) =>
                                        setEmailChangeCode(e.target.value)
                                    }
                                />
                            </div>

                            <div className="profile-actions">
                                <button onClick={confirmEmailChange}>
                                    Подтвердить новый email
                                </button>
                            </div>

                        </div>
                    )}

                </div>

            </main>

        </div>
    );
}

export default Profile;