import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-teal-600 text-white shadow-md">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link to="/" className="text-2xl font-bold">Splitwise Clone</Link>
                    <div className="flex items-center space-x-4">
                        {user && (
                            <>
                                <span>Olá, {user.name}</span>
                                <button
                                    onClick={handleLogout}
                                    className="bg-teal-700 hover:bg-teal-800 px-3 py-1 rounded transition"
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
