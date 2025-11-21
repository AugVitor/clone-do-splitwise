import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

interface Group {
    id: string;
    name: string;
    description?: string;
    _count: {
        members: number;
    };
}

export const Dashboard: React.FC = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await client.get('/groups');
            setGroups(res.data);
        } catch (error) {
            console.error('Error fetching groups', error);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await client.post('/groups', { name: newGroupName, description: newGroupDesc });
            setShowCreateModal(false);
            setNewGroupName('');
            setNewGroupDesc('');
            fetchGroups();
        } catch (error) {
            console.error('Error creating group', error);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Meus Grupos</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition"
                >
                    + Novo Grupo
                </button>
            </div>

            {groups.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-10">Você ainda não participa de nenhum grupo.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => (
                        <Link to={`/groups/${group.id}`} key={group.id} className="block">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition border border-gray-200 dark:border-gray-700">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{group.name}</h3>
                                {group.description && <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">{group.description}</p>}
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {group._count.members} membros
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md transition-colors duration-200">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">Criar Novo Grupo</h2>
                        <form onSubmit={handleCreateGroup}>
                            <div className="mb-4">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2">Nome do Grupo</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded dark:bg-gray-700 dark:text-white"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 dark:text-gray-300 mb-2">Descrição (opcional)</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded dark:bg-gray-700 dark:text-white"
                                    value={newGroupDesc}
                                    onChange={(e) => setNewGroupDesc(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
                                >
                                    Criar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
