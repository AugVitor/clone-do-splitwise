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
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Registrar Pagamento</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Pagando para</label>
                        <select
                            className="w-full border border-gray-300 p-2 rounded"
                            value={paidTo}
                            onChange={(e) => setPaidTo(e.target.value)}
                        >
                            {members.filter(m => m.userId !== currentUserId).map(m => (
                                <option key={m.userId} value={m.userId}>{m.user.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 mb-2">Valor (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full border border-gray-300 p-2 rounded"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-600 hover:text-gray-800"
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
