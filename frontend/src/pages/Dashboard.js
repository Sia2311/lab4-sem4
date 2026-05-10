import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api/axios';

import '../styles/dashboard.css';

const initialFilters = {
    title: '',
    description: '',
    location: '',
    date: '',
    status: '',
    responsible: ''
};

const columns = [
    {
        key: 'title',
        label: 'Название',
        type: 'text',
        placeholder: 'Фильтр по названию'
    },
    {
        key: 'description',
        label: 'Описание',
        type: 'text',
        placeholder: 'Фильтр по описанию'
    },
    {
        key: 'location',
        label: 'Место',
        type: 'select'
    },
    {
        key: 'date',
        label: 'Дата',
        type: 'text',
        placeholder: 'Например 2026-05'
    },
    {
        key: 'status',
        label: 'Статус',
        type: 'select'
    },
    {
        key: 'responsible',
        label: 'Ответственный',
        type: 'select'
    }
];

function normalize(value) {
    return String(value ?? '').trim().toLowerCase();
}

function getErrorMessage(error, fallbackMessage) {
    return error.response?.data?.message || fallbackMessage;
}

function Dashboard() {
    const navigate = useNavigate();

    const [incidents, setIncidents] = useState([]);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [responsible, setResponsible] = useState('');

    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [editResponsible, setEditResponsible] = useState('');
    const [editStatus, setEditStatus] = useState('OPEN');

    const [globalSearch, setGlobalSearch] = useState('');
    const [filters, setFilters] = useState(initialFilters);
    const [openFilter, setOpenFilter] = useState(null);

    const popupRef = useRef(null);
    const activeInputRef = useRef(null);

    useEffect(() => {
        fetchIncidents();
    }, []);

    useEffect(() => {
        if (!openFilter) {
            return undefined;
        }

        function handleClickOutside(event) {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setOpenFilter(null);
            }
        }

        function handleEscape(event) {
            if (event.key === 'Escape') {
                setOpenFilter(null);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [openFilter]);

    useEffect(() => {
        if (openFilter && activeInputRef.current) {
            activeInputRef.current.focus();
        }
    }, [openFilter]);

    async function fetchIncidents() {
        try {
            const response = await api.get('/incidents');
            setIncidents(response.data);
        } catch (error) {
            console.error(error);
            alert(getErrorMessage(error, 'Ошибка при загрузке инцидентов'));
        }
    }

    function getAuthHeaders() {
        const token = localStorage.getItem('token');

        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    }

    async function createIncident(e) {
        e.preventDefault();

        try {
            await api.post(
                '/incidents',
                {
                    title,
                    description,
                    location,
                    responsible,
                    status: 'OPEN',
                    date: new Date().toISOString().split('T')[0]
                },
                getAuthHeaders()
            );

            setTitle('');
            setDescription('');
            setLocation('');
            setResponsible('');

            fetchIncidents();
        } catch (error) {
            console.error(error);
            alert(getErrorMessage(error, 'Ошибка при добавлении инцидента'));
        }
    }

    function startEdit(item) {
        setEditingId(item.id);
        setEditTitle(item.title);
        setEditDescription(item.description);
        setEditLocation(item.location);
        setEditResponsible(item.responsible);
        setEditStatus(item.status);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditTitle('');
        setEditDescription('');
        setEditLocation('');
        setEditResponsible('');
        setEditStatus('OPEN');
    }

    async function updateIncident(id) {
        try {
            await api.put(
                `/incidents/${id}`,
                {
                    title: editTitle,
                    description: editDescription,
                    location: editLocation,
                    responsible: editResponsible,
                    status: editStatus
                },
                getAuthHeaders()
            );

            cancelEdit();
            fetchIncidents();
        } catch (error) {
            console.error(error);
            alert(getErrorMessage(error, 'Ошибка при изменении инцидента'));
        }
    }

    async function closeIncident(item) {
        try {
            await api.put(
                `/incidents/${item.id}`,
                {
                    ...item,
                    status: 'CLOSED'
                },
                getAuthHeaders()
            );

            fetchIncidents();
        } catch (error) {
            console.error(error);
            alert(getErrorMessage(error, 'Ошибка при закрытии инцидента'));
        }
    }

    async function deleteIncident(id) {
        const isConfirmed = window.confirm('Удалить этот инцидент?');

        if (!isConfirmed) {
            return;
        }

        try {
            await api.delete(`/incidents/${id}`, getAuthHeaders());
            fetchIncidents();
        } catch (error) {
            console.error(error);
            alert(getErrorMessage(error, 'Ошибка при удалении инцидента'));
        }
    }

    function logout() {
        localStorage.removeItem('token');
        navigate('/login');
    }

    function getStatusClass(status) {
        if (status === 'OPEN') {
            return 'status-badge status-open';
        }

        if (status === 'IN_PROGRESS') {
            return 'status-badge status-progress';
        }

        return 'status-badge status-closed';
    }

    function updateFilter(name, value) {
        setFilters((prev) => ({
            ...prev,
            [name]: value
        }));
    }

    function clearSingleFilter(name) {
        updateFilter(name, '');
    }

    function resetFilters() {
        setGlobalSearch('');
        setFilters(initialFilters);
        setOpenFilter(null);
    }

    function toggleFilter(name) {
        setOpenFilter((prev) => (prev === name ? null : name));
    }

    function isFilterActive(name) {
        return Boolean(filters[name]);
    }

    const options = useMemo(() => {
        function getUniqueValues(key) {
            return [...new Set(
                incidents
                    .map((item) => String(item[key] ?? '').trim())
                    .filter(Boolean)
            )].sort((a, b) => a.localeCompare(b, 'ru'));
        }

        return {
            location: getUniqueValues('location'),
            status: getUniqueValues('status'),
            responsible: getUniqueValues('responsible')
        };
    }, [incidents]);

    const filteredIncidents = useMemo(() => {
        const globalValue = normalize(globalSearch);

        return incidents.filter(item => {
            const title = normalize(item.title);
            const description = normalize(item.description);
            const location = normalize(item.location);
            const date = normalize(item.date);
            const status = normalize(item.status);
            const responsible = normalize(item.responsible);

            const matchesGlobal =
                !globalValue ||
                title.includes(globalValue) ||
                description.includes(globalValue) ||
                location.includes(globalValue) ||
                date.includes(globalValue) ||
                status.includes(globalValue) ||
                responsible.includes(globalValue);

            const matchesTitle =
                !filters.title || title.includes(normalize(filters.title));

            const matchesDescription =
                !filters.description || description.includes(normalize(filters.description));

            const matchesLocation =
                !filters.location || location === normalize(filters.location);

            const matchesDate =
                !filters.date || date.includes(normalize(filters.date));

            const matchesStatus =
                !filters.status || status === normalize(filters.status);

            const matchesResponsible =
                !filters.responsible || responsible === normalize(filters.responsible);

            return (
                matchesGlobal &&
                matchesTitle &&
                matchesDescription &&
                matchesLocation &&
                matchesDate &&
                matchesStatus &&
                matchesResponsible
            );
        });
    }, [incidents, globalSearch, filters]);

    const stats = useMemo(() => {
        const total = incidents.length;
        const open = incidents.filter(item => item.status === 'OPEN').length;
        const progress = incidents.filter(item => item.status === 'IN_PROGRESS').length;
        const closed = incidents.filter(item => item.status === 'CLOSED' || item.status === 'RESOLVED').length;

        return {
            total,
            open,
            progress,
            closed
        };
    }, [incidents]);

    function renderFilterPopup(column) {
        if (openFilter !== column.key) {
            return null;
        }

        const isTextFilter = column.type === 'text';
        const selectOptions = options[column.key] || [];

        return (
            <div className="column-filter-popup" ref={popupRef}>
                <div className="column-filter-popup-inner">
                    {isTextFilter ? (
                        <input
                            ref={activeInputRef}
                            type="text"
                            placeholder={column.placeholder}
                            value={filters[column.key]}
                            onChange={(e) => updateFilter(column.key, e.target.value)}
                        />
                    ) : (
                        <select
                            ref={activeInputRef}
                            value={filters[column.key]}
                            onChange={(e) => {
                                updateFilter(column.key, e.target.value);
                                setOpenFilter(null);
                            }}
                        >
                            <option value="">Все</option>

                            {selectOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    )}

                    <div className="column-filter-actions">
                        <button
                            type="button"
                            onClick={() => clearSingleFilter(column.key)}
                            disabled={!filters[column.key]}
                        >
                            Очистить
                        </button>

                        <button
                            type="button"
                            onClick={() => setOpenFilter(null)}
                        >
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">

            <aside className="sidebar">
                <div className="sidebar-logo">
                    SecurityApp
                </div>

                <nav className="sidebar-menu">
                    <a href="/dashboard" className="sidebar-link active">
                        Инциденты
                    </a>

                    <a href="/profile" className="sidebar-link">
                        Профиль
                    </a>

                    <button className="logout-btn" onClick={logout}>
                        Выйти
                    </button>
                </nav>
            </aside>

            <main className="dashboard-content">

                <header className="dashboard-header">
                    <div>
                        <h1>Панель инцидентов</h1>
                        <p>Мониторинг инцидентов безопасности образовательного учреждения</p>
                    </div>
                </header>

                <section className="stats-grid">
                    <div className="stat-card">
                        <span>Всего инцидентов</span>
                        <strong>{stats.total}</strong>
                    </div>

                    <div className="stat-card">
                        <span>Открытые</span>
                        <strong>{stats.open}</strong>
                    </div>

                    <div className="stat-card">
                        <span>В обработке</span>
                        <strong>{stats.progress}</strong>
                    </div>

                    <div className="stat-card">
                        <span>Закрытые</span>
                        <strong>{stats.closed}</strong>
                    </div>
                </section>

                <section className="incidents-card add-card">
                    <h2>Добавление инцидента</h2>

                    <form onSubmit={createIncident} className="incident-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Название</label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Название инцидента"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Место</label>
                                <input
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Место происшествия"
                                    required
                                />
                            </div>

                            <div className="form-group form-wide">
                                <label>Описание</label>
                                <input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Описание инцидента"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Ответственный</label>
                                <input
                                    value={responsible}
                                    onChange={(e) => setResponsible(e.target.value)}
                                    placeholder="Ответственный"
                                    required
                                />
                            </div>
                        </div>

                        <button className="action-btn form-btn" type="submit">
                            Добавить инцидент
                        </button>
                    </form>
                </section>

                <section className="incidents-card">
                    <div className="table-top">
                        <h2>Список инцидентов</h2>

                        <button
                            type="button"
                            className="filter-main-btn"
                            onClick={resetFilters}
                        >
                            Сбросить фильтры
                        </button>
                    </div>

                    <div className="search-panel">
                        <input
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                            placeholder="Общий поиск по инцидентам"
                        />
                    </div>

                    {incidents.length === 0 ? (
                        <p className="empty-message">Инциденты отсутствуют</p>
                    ) : (
                        <table className="incidents-table">
                            <thead>
                                <tr>
                                    {columns.map((column) => (
                                        <th key={column.key}>
                                            <div className="th-content">
                                                <span>{column.label}</span>

                                                <button
                                                    type="button"
                                                    className={`filter-icon-button ${isFilterActive(column.key) ? 'active' : ''}`}
                                                    onClick={() => toggleFilter(column.key)}
                                                    title="Фильтр"
                                                >
                                                    ▼
                                                </button>
                                            </div>

                                            {renderFilterPopup(column)}
                                        </th>
                                    ))}

                                    <th>Действия</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredIncidents.map(item => (
                                    <tr key={item.id}>
                                        {editingId === item.id ? (
                                            <>
                                                <td>
                                                    <input
                                                        className="table-input"
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                    />
                                                </td>

                                                <td>
                                                    <input
                                                        className="table-input"
                                                        value={editDescription}
                                                        onChange={(e) => setEditDescription(e.target.value)}
                                                    />
                                                </td>

                                                <td>
                                                    <input
                                                        className="table-input"
                                                        value={editLocation}
                                                        onChange={(e) => setEditLocation(e.target.value)}
                                                    />
                                                </td>

                                                <td>{item.date}</td>

                                                <td>
                                                    <select
                                                        className="table-input"
                                                        value={editStatus}
                                                        onChange={(e) => setEditStatus(e.target.value)}
                                                    >
                                                        <option value="OPEN">OPEN</option>
                                                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                                                        <option value="CLOSED">CLOSED</option>
                                                    </select>
                                                </td>

                                                <td>
                                                    <input
                                                        className="table-input"
                                                        value={editResponsible}
                                                        onChange={(e) => setEditResponsible(e.target.value)}
                                                    />
                                                </td>

                                                <td>
                                                    <div className="table-actions">
                                                        <button
                                                            className="action-btn save-btn"
                                                            onClick={() => updateIncident(item.id)}
                                                        >
                                                            Сохранить
                                                        </button>

                                                        <button
                                                            className="action-btn cancel-btn"
                                                            onClick={cancelEdit}
                                                        >
                                                            Отмена
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>{item.title}</td>
                                                <td>{item.description}</td>
                                                <td>{item.location}</td>
                                                <td>{item.date}</td>

                                                <td>
                                                    <span className={getStatusClass(item.status)}>
                                                        {item.status}
                                                    </span>
                                                </td>

                                                <td>{item.responsible}</td>

                                                <td>
                                                    <div className="table-actions">
                                                        <button
                                                            className="action-btn edit-btn"
                                                            onClick={() => startEdit(item)}
                                                        >
                                                            Изменить
                                                        </button>

                                                        {item.status !== 'CLOSED' && (
                                                            <button
                                                                className="action-btn close-btn"
                                                                onClick={() => closeIncident(item)}
                                                            >
                                                                Закрыть
                                                            </button>
                                                        )}

                                                        <button
                                                            className="action-btn delete-btn"
                                                            onClick={() => deleteIncident(item.id)}
                                                        >
                                                            Удалить
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {incidents.length > 0 && filteredIncidents.length === 0 && (
                        <p className="empty-message">По заданным условиям инциденты не найдены</p>
                    )}
                </section>

            </main>

        </div>
    );
}

export default Dashboard;