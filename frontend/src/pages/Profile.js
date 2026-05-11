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

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        try {
            const response = await api.get('/profile');

            setUser(response.data);

            setName(response.data.name);
            setEmail(response.data.email);

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
            await api.put('/profile', {
                name,
                email,
                password
            });

            alert('Профиль успешно обновлён');

            setPassword('');
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
                            <div className="profile-row">

                                <span>Новый пароль</span>

                                <input
                                    type="password"
                                    placeholder="Введите новый пароль"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />

                            </div>
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
                                    }}
                                >
                                    Отмена
                                </button>
                            </>
                        )}

                    </div>

                </div>

            </main>

        </div>
    );
}

export default Profile;