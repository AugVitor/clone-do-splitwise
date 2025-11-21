import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';

export const Register: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await client.post('/auth/register', { name, email, password });
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md mt-10 transition-colors duration-200">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">Criar Conta</h2>
            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 mb-2">Nome</label>
                    <input
                        type="text"
                        className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded focus:outline-none focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 mb-2">Email</label>
                    <input
                        type="email"
                        className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded focus:outline-none focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 dark:text-gray-300 mb-2">Senha</label>
                    <input
                        type="password"
                        className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded focus:outline-none focus:border-teal-500 dark:bg-gray-700 dark:text-white"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700 transition"
                >
                    Registrar
                </button>
            </form>
            <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
                Já tem conta? <Link to="/login" className="text-teal-600 hover:underline dark:text-teal-400">Faça Login</Link>
            </p>
        </div>
    );
};
