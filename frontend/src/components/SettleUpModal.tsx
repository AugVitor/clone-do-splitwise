import React, { useState } from 'react';
import client from '../api/client';

interface Member {
    userId: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}

interface SettleUpModalProps {
    groupId: string;
    members: Member[];
    onClose: () => void;
    onSuccess: () => void;
    currentUserId: string;
}

export const SettleUpModal: React.FC<SettleUpModalProps> = ({ groupId, members, onClose, onSuccess, currentUserId }) => {
    const [paidTo, setPaidTo] = useState(members.find(m => m.userId !== currentUserId)?.userId || '');
    const [amount, setAmount] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await client.post(`/groups/${groupId}/payments`, {
                toUserId: paidTo,
                amount: parseFloat(amount),
            });
            onSuccess();
        } catch (error) {
            console.error('Error creating payment', error);
            alert('Erro ao registrar pagamento');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md transition-colors duration-200">
                <h2 className="text-xl font-bold mb-4 dark:text-white">Registrar Pagamento</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 mb-2">Pagando para</label>
                        <select
                            className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded dark:bg-gray-700 dark:text-white"
                            value={paidTo}
                            onChange={(e) => setPaidTo(e.target.value)}
                        >
                            {members.filter(m => m.userId !== currentUserId).map(m => (
                                <option key={m.userId} value={m.userId}>{m.user.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 dark:text-gray-300 mb-2">Valor (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded dark:bg-gray-700 dark:text-white"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
                        >
                            Pagar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
