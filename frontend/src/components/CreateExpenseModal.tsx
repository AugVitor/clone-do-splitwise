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

interface CreateExpenseModalProps {
    groupId: string;
    members: Member[];
    onClose: () => void;
    onSuccess: () => void;
    currentUserId: string;
}

export const CreateExpenseModal: React.FC<CreateExpenseModalProps> = ({ groupId, members, onClose, onSuccess, currentUserId }) => {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [paidBy, setPaidBy] = useState(currentUserId);
    const [note, setNote] = useState('');
    const [splitType] = useState<'equal' | 'exact'>('equal');
    const [selectedMembers, setSelectedMembers] = useState<string[]>(members.map(m => m.userId));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return;

        let participants: { userId: string; shareAmount: number }[] = [];

        if (splitType === 'equal') {
            const share = numAmount / selectedMembers.length;
            participants = selectedMembers.map(id => ({
                userId: id,
                shareAmount: parseFloat(share.toFixed(2)), // Simple rounding, might have penny issues but ok for MVP
            }));

            // Fix penny rounding error on the first person
            const currentSum = participants.reduce((sum, p) => sum + p.shareAmount, 0);
            const diff = numAmount - currentSum;
            if (Math.abs(diff) > 0.001) {
                participants[0].shareAmount += diff;
            }
        } else {
            // Implement exact split logic if needed, for MVP equal is fine or just equal for now
            // For simplicity in MVP, let's stick to equal split among selected members
            // But if I want to support exact, I'd need more UI.
            // Let's stick to equal split for MVP to save time and complexity.
            // I'll remove the splitType state for now and just assume equal among selected.
        }

        try {
            await client.post(`/groups/${groupId}/expenses`, {
                title,
                amount: numAmount,
                paidByUserId: paidBy,
                participants,
                note
            });
            onSuccess();
        } catch (error) {
            console.error('Error creating expense', error);
            alert('Erro ao criar despesa');
        }
    };

    const toggleMember = (userId: string) => {
        if (selectedMembers.includes(userId)) {
            setSelectedMembers(selectedMembers.filter(id => id !== userId));
        } else {
            setSelectedMembers([...selectedMembers, userId]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Adicionar Despesa</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Descrição</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 p-2 rounded"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
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
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Pago por</label>
                        <select
                            className="w-full border border-gray-300 p-2 rounded"
                            value={paidBy}
                            onChange={(e) => setPaidBy(e.target.value)}
                        >
                            {members.map(m => (
                                <option key={m.userId} value={m.userId}>{m.user.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Dividido com</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto border p-2 rounded">
                            {members.map(m => (
                                <div key={m.userId} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedMembers.includes(m.userId)}
                                        onChange={() => toggleMember(m.userId)}
                                        className="mr-2"
                                    />
                                    <span>{m.user.name}</span>
                                </div>
                            ))}
                        </div>
                        {selectedMembers.length === 0 && <p className="text-red-500 text-sm">Selecione pelo menos um participante.</p>}
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 mb-2">Nota (opcional)</label>
                        <textarea
                            className="w-full border border-gray-300 p-2 rounded"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
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
                            disabled={selectedMembers.length === 0}
                            className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 disabled:opacity-50"
                        >
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
