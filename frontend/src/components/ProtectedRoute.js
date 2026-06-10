import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import api from '../api/axios';

function ProtectedRoute({ children }) {
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        async function checkAuth() {
            try {
                await api.get('/profile');
                setIsAuthorized(true);
            } catch (error) {
                setIsAuthorized(false);
            } finally {
                setIsChecking(false);
            }
        }

        checkAuth();
    }, []);

    if (isChecking) {
        return (
            <div style={{ padding: '30px' }}>
                Проверка авторизации...
            </div>
        );
    }

    if (!isAuthorized) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;