import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:4000/api'
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,

    (error) => {
        if (error.response) {
            const status = error.response.status;

            if (status === 401) {
                alert('Сессия истекла. Выполните вход повторно.');

                localStorage.removeItem('token');

                window.location.href = '/login';
            }

            if (status === 403) {
                alert('Недостаточно прав для выполнения действия');
            }
        }

        return Promise.reject(error);
    }
);

export default api;