import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
    withCredentials: true
});

api.interceptors.response.use(
    (response) => response,

    (error) => {
        const requestUrl = error.config?.url || '';
        const isAuthRequest =
            requestUrl.includes('/auth/login') ||
            requestUrl.includes('/auth/register') ||
            requestUrl.includes('/auth/verify-code') ||
            requestUrl.includes('/auth/logout');

        if (error.response && !isAuthRequest) {
            const status = error.response.status;

            if (status === 401) {
                alert('Сессия истекла. Выполните вход повторно.');

                localStorage.removeItem('pendingEmail');

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