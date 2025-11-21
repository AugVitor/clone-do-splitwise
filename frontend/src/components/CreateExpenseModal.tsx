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
    const [splitType, setSplitType] = useState<'equal' | 'exact' | 'percentage'>('equal');
    const [selectedMembers, setSelectedMembers] = useState<string[]>(members.map(m => m.userId));
    const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
    const [percentages, setPercentages] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return;

        let participants: { userId: string; shareAmount: number }[] = [];

        if (splitType === 'equal') {
            if (selectedMembers.length === 0) return;
            const share = numAmount / selectedMembers.length;
            participants = selectedMembers.map(id => ({
                userId: id,
                shareAmount: parseFloat(share.toFixed(2)),
            }));

            const currentSum = participants.reduce((sum, p) => sum + p.shareAmount, 0);
            const diff = numAmount - currentSum;
            if (Math.abs(diff) > 0.001) {
                participants[0].shareAmount += diff;
            }
        } else if (splitType === 'exact') {
            let sum = 0;
            participants = members.map(m => {
                const val = parseFloat(exactAmounts[m.userId] || '0');
                sum += val;
                return { userId: m.userId, shareAmount: val };
            }).filter(p => p.shareAmount > 0);

            if (Math.abs(sum - numAmount) > 0.01) {
                alert(`A soma dos valores (R$ ${sum.toFixed(2)}) não bate com o total (R$ ${numAmount.toFixed(2)})`);
                return;
            }
        } else if (splitType === 'percentage') {
            let sum = 0;
            participants = members.map(m => {
                const pct = parseFloat(percentages[m.userId] || '0');
                sum += pct;
                const val = (numAmount * pct) / 100;
                return { userId: m.userId, shareAmount: parseFloat(val.toFixed(2)) };
            }).filter(p => p.shareAmount > 0);

            if (Math.abs(sum - 100) > 0.1) {
                alert(`A soma das porcentagens (${sum}%) deve ser 100%`);
                return;
            }

            // Fix rounding
            const currentSum = participants.reduce((sum, p) => sum + p.shareAmount, 0);
            const diff = numAmount - currentSum;
            if (Math.abs(diff) > 0.001 && participants.length > 0) {
                participants[0].shareAmount += diff;
            }
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
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto transition-colors duration-200">
                <h2 className="text-xl font-bold mb-4 dark:text-white">Adicionar Despesa</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 mb-2">Descrição</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded dark:bg-gray-700 dark:text-white"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
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
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 mb-2">Pago por</label>
                        <select
                            className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded dark:bg-gray-700 dark:text-white"
                            value={paidBy}
                            onChange={(e) => setPaidBy(e.target.value)}
                        >
                            {members.map(m => (
                                <option key={m.userId} value={m.userId}>{m.user.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 mb-2">Tipo de Divisão</label>
                        <div className="flex space-x-4 mb-2">
                            <label className="flex items-center dark:text-gray-300">
                                <input
                                    type="radio"
                                    value="equal"
                                    checked={splitType === 'equal'}
                                    onChange={() => setSplitType('equal')}
                                    className="mr-2"
                                />
                                Igual
                            </label>
                            <label className="flex items-center dark:text-gray-300">
                                <input
                                    type="radio"
                                    value="exact"
                                    checked={splitType === 'exact'}
                                    onChange={() => setSplitType('exact')}
                                    className="mr-2"
                                />
                                Valor Exato
                            </label>
                            <label className="flex items-center dark:text-gray-300">
                                <input
                                    type="radio"
                                    value="percentage"
                                    checked={splitType === 'percentage'}
                                    onChange={() => setSplitType('percentage')}
                                    className="mr-2"
                                />
                                Porcentagem
                            </label>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 p-2 rounded">
                            {splitType === 'equal' && members.map(m => (
                                <div key={m.userId} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedMembers.includes(m.userId)}
                                        onChange={() => toggleMember(m.userId)}
                                        className="mr-2"
                                    />
                                    <span className="dark:text-gray-300">{m.user.name}</span>
                                </div>
                            ))}

                            {splitType === 'exact' && members.map(m => (
                                <div key={m.userId} className="flex items-center justify-between">
                                    <span className="dark:text-gray-300">{m.user.name}</span>
                                    <div className="flex items-center">
                                        <span className="mr-1 dark:text-gray-400">R$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-24 border border-gray-300 dark:border-gray-600 p-1 rounded dark:bg-gray-700 dark:text-white text-right"
                                            value={exactAmounts[m.userId] || ''}
                                            onChange={(e) => setExactAmounts({ ...exactAmounts, [m.userId]: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            ))}

                            {splitType === 'percentage' && members.map(m => (
                                <div key={m.userId} className="flex items-center justify-between">
                                    <span className="dark:text-gray-300">{m.user.name}</span>
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="w-20 border border-gray-300 dark:border-gray-600 p-1 rounded dark:bg-gray-700 dark:text-white text-right"
                                            value={percentages[m.userId] || ''}
                                            onChange={(e) => setPercentages({ ...percentages, [m.userId]: e.target.value })}
                                            placeholder="0"
                                        />
                                        <span className="ml-1 dark:text-gray-400">%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {splitType === 'equal' && selectedMembers.length === 0 && <p className="text-red-500 text-sm mt-1">Selecione pelo menos um participante.</p>}
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 dark:text-gray-300 mb-2">Nota (opcional)</label>
                        <textarea
                            className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded dark:bg-gray-700 dark:text-white"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
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
                            disabled={splitType === 'equal' && selectedMembers.length === 0}
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
