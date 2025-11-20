import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CreateExpenseModal } from '../components/CreateExpenseModal';
import { SettleUpModal } from '../components/SettleUpModal';

interface Group {
    id: string;
    name: string;
    members: {
        userId: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
    }[];
}

interface Expense {
    id: string;
    title: string;
    amount: string;
    date: string;
    paidBy: {
        id: string;
        name: string;
    };
    shares: {
        user: {
            name: string;
        };
        shareAmount: string;
    }[];
}

interface Balance {
    userId: string;
    user: {
        name: string;
    };
    balance: number;
}

export const GroupDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [group, setGroup] = useState<Group | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [balances, setBalances] = useState<Balance[]>([]);
    const [activeTab, setActiveTab] = useState<'expenses' | 'balances'>('expenses');
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showSettleModal, setShowSettleModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');

    useEffect(() => {
        if (id) {
            fetchGroupDetails();
            fetchExpenses();
            fetchBalances();
        }
    }, [id]);

    const fetchGroupDetails = async () => {
        try {
            const res = await client.get(`/groups/${id}`);
            setGroup(res.data);
        } catch (error) {
            console.error('Error fetching group', error);
        }
    };

    const fetchExpenses = async () => {
        try {
            const res = await client.get(`/groups/${id}/expenses`);
            setExpenses(res.data);
        } catch (error) {
            console.error('Error fetching expenses', error);
        }
    };

    const fetchBalances = async () => {
        try {
            const res = await client.get(`/groups/${id}/balances`);
            setBalances(res.data);
        } catch (error) {
            console.error('Error fetching balances', error);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await client.post(`/groups/${id}/members`, { email: newMemberEmail });
            setNewMemberEmail('');
            setShowAddMemberModal(false);
            fetchGroupDetails();
            fetchBalances(); // Update balances as new member starts with 0
        } catch (error) {
            console.error('Error adding member', error);
            alert('Erro ao adicionar membro. Verifique o email.');
        }
    };

    const formatCurrency = (val: string | number) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    if (!group) return <div className="p-8 text-center">Carregando...</div>;

    return (
        <div>
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">{group.name}</h1>
                        <p className="text-gray-600">
                            {group.members.length} membros: {group.members.map(m => m.user.name).join(', ')}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddMemberModal(true)}
                        className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 text-sm"
                    >
                        + Adicionar Membro
                    </button>
                </div>
            </div>

            <div className="flex mb-4 border-b border-gray-200">
                <button
                    className={`px-6 py-2 font-medium ${activeTab === 'expenses' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('expenses')}
                >
                    Despesas
                </button>
                <button
                    className={`px-6 py-2 font-medium ${activeTab === 'balances' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('balances')}
                >
                    Saldos
                </button>
            </div>

            {activeTab === 'expenses' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-700">Lista de Despesas</h2>
                        <button
                            onClick={() => setShowExpenseModal(true)}
                            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 shadow"
                        >
                            Adicionar Despesa
                        </button>
                    </div>

                    <div className="space-y-4">
                        {expenses.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">Nenhuma despesa registrada.</p>
                        ) : (
                            expenses.map(expense => (
                                <div key={expense.id} className="bg-white p-4 rounded shadow border-l-4 border-teal-500 flex justify-between items-center">
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">{formatDate(expense.date)}</div>
                                        <h3 className="text-lg font-bold text-gray-800">{expense.title}</h3>
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">{expense.paidBy.name}</span> pagou {formatCurrency(expense.amount)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500">
                                            para {expense.shares.length} pessoas
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'balances' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-700">Saldos</h2>
                        <button
                            onClick={() => setShowSettleModal(true)}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow"
                        >
                            Registrar Pagamento (Settle Up)
                        </button>
                    </div>

                    <div className="bg-white rounded shadow overflow-hidden">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membro</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {balances.map(b => (
                                    <tr key={b.userId}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{b.user.name}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${b.balance > 0 ? 'text-green-600' : b.balance < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                            {formatCurrency(b.balance)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {b.balance > 0 ? 'Recebe' : b.balance < 0 ? 'Deve' : 'Quitado'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showExpenseModal && id && user && (
                <CreateExpenseModal
                    groupId={id}
                    members={group.members}
                    currentUserId={user.id}
                    onClose={() => setShowExpenseModal(false)}
                    onSuccess={() => {
                        setShowExpenseModal(false);
                        fetchExpenses();
                        fetchBalances();
                    }}
                />
            )}

            {showSettleModal && id && user && (
                <SettleUpModal
                    groupId={id}
                    members={group.members}
                    currentUserId={user.id}
                    onClose={() => setShowSettleModal(false)}
                    onSuccess={() => {
                        setShowSettleModal(false);
                        fetchBalances();
                    }}
                />
            )}

            {showAddMemberModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                        <h2 className="text-xl font-bold mb-4">Adicionar Membro</h2>
                        <form onSubmit={handleAddMember}>
                            <div className="mb-6">
                                <label className="block text-gray-700 mb-2">Email do Usuário</label>
                                <input
                                    type="email"
                                    className="w-full border border-gray-300 p-2 rounded"
                                    value={newMemberEmail}
                                    onChange={(e) => setNewMemberEmail(e.target.value)}
                                    required
                                    placeholder="exemplo@email.com"
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddMemberModal(false)}
                                    className="text-gray-600 hover:text-gray-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
                                >
                                    Adicionar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
