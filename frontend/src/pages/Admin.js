import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api/axios';

import '../styles/admin.css';

const roles = [
    { value: 'student', label: 'Студент' },
    { value: 'teacher', label: 'Преподаватель' },
    { value: 'security', label: 'Охрана' },
    { value: 'admin', label: 'Администратор' }
];

function getActionLabel(action) {
    const labels = {
        REGISTER_USER: 'Регистрация',
        LOGIN_USER: 'Вход в систему',
        CREATE_INCIDENT: 'Создание инцидента',
        UPDATE_INCIDENT: 'Изменение инцидента',
        DELETE_INCIDENT: 'Удаление инцидента',
        ADMIN_DELETE_INCIDENT: 'Удаление инцидента',
        UPDATE_USER_ROLE: 'Изменение роли',
        DELETE_USER: 'Удаление пользователя'
    };

    return labels[action] || action;
}

function getActionClass(action) {
    if (action.includes('CREATE') || action.includes('REGISTER')) {
        return 'log-action create';
    }

    if (action.includes('UPDATE') || action.includes('LOGIN')) {
        return 'log-action update';
    }

    if (action.includes('DELETE')) {
        return 'log-action delete';
    }

    return 'log-action';
}

function getLogIcon(action) {
    if (action.includes('DELETE')) {
        return '−';
    }

    if (action.includes('CREATE') || action.includes('REGISTER')) {
        return '+';
    }

    if (action.includes('LOGIN')) {
        return '↪';
    }

    return '↻';
}

function Admin() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAdminData();
    }, []);


    async function fetchAdminData() {
        try {
            setError('');

            const usersResponse = await api.get('/admin/users');
            const incidentsResponse = await api.get('/admin/incidents');
            const logsResponse = await api.get('/admin/audit-logs');
            
            setUsers(usersResponse.data);
            setIncidents(incidentsResponse.data);
            setLogs(logsResponse.data);
        } catch (error) {
            console.error(error);

            if (error.response?.status === 403 || error.response?.status === 401) {
                alert('Доступ в админ-панель разрешён только администратору');
                navigate('/dashboard');
                return;
            }

            setError(
                error.response?.data?.message ||
                'Ошибка загрузки данных админ-панели'
            );
        }
    }

    async function changeUserRole(userId, role) {
        try {
            await api.patch(
                `/admin/users/${userId}/role`,
                {role}
            );

            fetchAdminData();
        } catch (error) {
            console.error(error);

            alert(
                error.response?.data?.message ||
                'Ошибка изменения роли пользователя'
            );
        }
    }

    async function deleteUser(userId) {
        const isConfirmed = window.confirm('Удалить пользователя?');

        if (!isConfirmed) {
            return;
        }

        try {
            await api.delete(`/admin/users/${userId}`);

            fetchAdminData();
        } catch (error) {
            console.error(error);

            alert(
                error.response?.data?.message ||
                'Ошибка удаления пользователя'
            );
        }
    }

    async function deleteIncident(incidentId) {
        const isConfirmed = window.confirm('Удалить инцидент?');

        if (!isConfirmed) {
            return;
        }

        try {
            await api.delete(`/admin/incidents/${incidentId}`);

            fetchAdminData();
        } catch (error) {
            console.error(error);

            alert(
                error.response?.data?.message ||
                'Ошибка удаления инцидента'
            );
        }
    }

    async function logout() {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error(error);
        } finally {
            localStorage.removeItem('pendingEmail');
            navigate('/login');
        }
    }

    return (
        <div className="admin-page">
            <header className="admin-header">
                <div>
                    <h1>Админ-панель</h1>

                    <p>
                        Управление пользователями, инцидентами и журналом действий
                    </p>
                </div>

                <div className="admin-header-actions">
                    <button onClick={() => navigate('/dashboard')}>
                        Инциденты
                    </button>

                    <button onClick={() => navigate('/profile')}>
                        Профиль
                    </button>

                    <button className="logout-btn" onClick={logout}>
                        Выйти
                    </button>
                </div>
            </header>

            <main className="admin-content">
                {error && (
                    <div className="admin-error">
                        {error}
                    </div>
                )}

                <section className="admin-stats-grid">
                    <div className="admin-stat-card">
                        <span>Пользователи</span>
                        <strong>{users.length}</strong>
                    </div>

                    <div className="admin-stat-card">
                        <span>Инциденты</span>
                        <strong>{incidents.length}</strong>
                    </div>

                    <div className="admin-stat-card">
                        <span>Записи журнала</span>
                        <strong>{logs.length}</strong>
                    </div>
                </section>

                <section className="admin-card">
                    <div className="admin-card-header">
                        <h2>Пользователи</h2>
                        <span>{users.length}</span>
                    </div>

                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Имя</th>
                                    <th>Email</th>
                                    <th>Роль</th>
                                    <th>Дата создания</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>

                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.name}</td>

                                        <td>{user.email}</td>

                                        <td>
                                            <select
                                                value={user.role}
                                                onChange={(event) =>
                                                    changeUserRole(user.id, event.target.value)
                                                }
                                            >
                                                {roles.map(role => (
                                                    <option key={role.value} value={role.value}>
                                                        {role.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>

                                        <td>
                                            {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                                        </td>

                                        <td>
                                            <button
                                                className="danger-btn"
                                                onClick={() => deleteUser(user.id)}
                                            >
                                                Удалить
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="admin-card">
                    <div className="admin-card-header">
                        <h2>Инциденты</h2>
                        <span>{incidents.length}</span>
                    </div>

                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Название</th>
                                    <th>Место</th>
                                    <th>Статус</th>
                                    <th>Ответственный</th>
                                    <th>Дата</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>

                            <tbody>
                                {incidents.map(incident => (
                                    <tr key={incident.id}>
                                        <td>{incident.title}</td>

                                        <td>{incident.location}</td>

                                        <td>
                                            <span className={`status ${incident.status.toLowerCase()}`}>
                                                {incident.status}
                                            </span>
                                        </td>

                                        <td>{incident.responsible}</td>

                                        <td>{incident.date}</td>

                                        <td>
                                            <button
                                                className="danger-btn"
                                                onClick={() => deleteIncident(incident.id)}
                                            >
                                                Удалить
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="admin-card">
                    <div className="admin-card-header">
                        <h2>Журнал действий</h2>
                        <span>{logs.length}</span>
                    </div>

                    {logs.length === 0 ? (
                        <p className="admin-empty">
                            Журнал действий пока пуст
                        </p>
                    ) : (
                        <div className="audit-log-list">
                            {logs.map(log => (
                                <div className="audit-log-item" key={log.id}>
                                    <div className="audit-log-icon">
                                        {getLogIcon(log.action)}
                                    </div>

                                    <div className="audit-log-main">
                                        <div className="audit-log-top">
                                            <span className={getActionClass(log.action)}>
                                                {getActionLabel(log.action)}
                                            </span>

                                            <span className="audit-log-date">
                                                {new Date(log.createdAt).toLocaleString('ru-RU')}
                                            </span>
                                        </div>

                                        <div className="audit-log-message">
                                            {log.message}
                                        </div>

                                        <div className="audit-log-meta">
                                            <span>
                                                Пользователь: {log.userEmail || 'неизвестно'}
                                            </span>

                                            <span>
                                                Роль: {log.userRole || '—'}
                                            </span>

                                            <span>
                                                IP: {log.ip || '—'}
                                            </span>

                                            <span>
                                                Устройство: {log.userAgent ? `${log.userAgent.slice(0, 60)}...` : '—'}
                                            </span>

                                            <span>
                                                Объект: {log.entityType}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default Admin;