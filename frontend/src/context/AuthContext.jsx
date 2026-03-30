import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount and refresh role/profile from server.
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        const bootstrapAuth = async () => {
            if (token && userData) {
                const parsed = JSON.parse(userData);
                // Tương thích ngược: nếu có userId thay vì id thì chuẩn hóa
                if (parsed.userId && !parsed.id) {
                    parsed.id = parsed.userId;
                    delete parsed.userId;
                }

                setUser(parsed);

                try {
                    const response = await userAPI.getMyProfile();
                    const freshUser = response.data;
                    localStorage.setItem('user', JSON.stringify(freshUser));
                    setUser(freshUser);
                } catch {
                    // Keep local snapshot if profile refresh fails transiently.
                    localStorage.setItem('user', JSON.stringify(parsed));
                }
            }

            setLoading(false);
        };

        bootstrapAuth();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await authAPI.login({ username, password });
            // Backend trả về { token, userId, username, email, role }
            // Chuẩn hóa userId → id để dùng nhất quán trong toàn app
            const { token, userId, ...rest } = response.data;
            const userData = { ...rest, id: userId };

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed',
            };
        }
    };

    const register = async (username, email, password) => {
        try {
            const response = await authAPI.register({ username, email, password });

            return {
                success: true,
                message: response.data.message,
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Registration failed',
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const isAdmin = () => {
        return user?.role === 'ADMIN';
    };

    const isEditor = () => {
        return user?.role === 'EDITOR';
    };

    const canManageBlogs = () => {
        return user?.role === 'ADMIN' || user?.role === 'EDITOR';
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAdmin,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
