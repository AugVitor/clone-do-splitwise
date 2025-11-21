import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <header className="bg-teal-600 dark:bg-teal-800 text-white shadow-md transition-colors duration-200">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link to="/" className="text-2xl font-bold">Splitwise Clone</Link>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded hover:bg-teal-700 dark:hover:bg-teal-900 transition"
                            title="Alternar Tema"
                        >
                            {theme === 'light' ? '🌙' : '☀️'}
                        </button>
                        {user && (
                            <>
                                <span className="hidden md:inline">Olá, {user.name}</span>
                                <button
                                    onClick={handleLogout}
                                    className="bg-teal-700 dark:bg-teal-900 hover:bg-teal-800 dark:hover:bg-teal-950 px-3 py-1 rounded transition"
                                >
                                    Sair
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
};
