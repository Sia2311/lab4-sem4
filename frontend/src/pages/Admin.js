import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api/axios';

import '../styles/admin.css';

function Admin() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAdminData();
    }, []);

    async function fetchAdminData() {
        try {
            setError('');

            const usersResponse = await api.get('/admin/users');
            const incidentsResponse = await api.get('/admin/incidents');

            setUsers(usersResponse.data);
            setIncidents(incidentsResponse.data);
        } catch (error) {
            console.error(error);

            setError(
                error.response?.data?.message ||
                'Ошибка загрузки данных админ-панели'
            );
        }
    }

    async function changeUserRole(userId, role) {
        try {
            await api.patch(`/admin/users/${userId}/role`, {
                role
            });

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

        if (!isConfirmed) return;

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

        if (!isConfirmed) return;

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

    function logout() {
        localStorage.removeItem('token');
        navigate('/login');
    }

    return (
        <div className="admin-page">

            <header className="admin-header">

                <div>
                    <h1>Админ-панель</h1>

                    <p>
                        Управление пользователями и инцидентами системы
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
                                                onChange={(e) =>
                                                    changeUserRole(user.id, e.target.value)
                                                }
                                            >
                                                <option value="user">
                                                    user
                                                </option>

                                                <option value="admin">
                                                    admin
                                                </option>
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

            </main>

        </div>
    );
}

export default Admin;