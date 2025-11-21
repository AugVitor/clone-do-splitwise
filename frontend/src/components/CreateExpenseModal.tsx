import React, { useState, useEffect } from 'react';
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

    // New split mode state
    const [splitMode, setSplitMode] = useState<'equal' | 'reimbursement'>('equal');

    // selectedMembers tracks WHO ELSE is involved (excluding payer logic)
    // Initially select everyone except payer (if reimbursement) or everyone (if equal)
    // To simplify: selectedMembers will track the "Other people" involved.
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    // Initialize selectedMembers when modal opens or paidBy changes
    useEffect(() => {
        // Default: Select everyone else
        const others = members.filter(m => m.userId !== paidBy).map(m => m.userId);
        setSelectedMembers(others);
    }, [paidBy, members]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return;

        let participants: { userId: string; shareAmount: number }[] = [];

        // Construct the list of people splitting the cost
        let splitAmongIds = [...selectedMembers];

        if (splitMode === 'equal') {
            // In equal mode, the payer is ALSO included in the split
            if (!splitAmongIds.includes(paidBy)) {
                splitAmongIds.push(paidBy);
            }
        } else {
            // In reimbursement mode, the payer is EXCLUDED (already handled by selectedMembers logic, but safety check)
            splitAmongIds = splitAmongIds.filter(id => id !== paidBy);
        }

        if (splitAmongIds.length === 0) {
            alert('Selecione pelo menos uma pessoa para dividir.');
            return;
        }

        const share = numAmount / splitAmongIds.length;
        participants = splitAmongIds.map(id => ({
            userId: id,
            shareAmount: parseFloat(share.toFixed(2)),
        }));

        // Fix rounding
        const currentSum = participants.reduce((sum, p) => sum + p.shareAmount, 0);
        const diff = numAmount - currentSum;
        if (Math.abs(diff) > 0.001) {
            participants[0].shareAmount += diff;
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

                    <div className="mb-6">
                        <label className="block text-gray-700 dark:text-gray-300 mb-2">Como dividir?</label>
                        <div className="grid grid-cols-1 gap-3 mb-4">
                            <button
                                type="button"
                                onClick={() => setSplitMode('equal')}
                                className={`p-3 rounded border text-left flex items-center transition-colors ${splitMode === 'equal'
                                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 ring-1 ring-teal-500'
                                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${splitMode === 'equal' ? 'border-teal-500 bg-teal-500' : 'border-gray-400'
                                    }`}>
                                    {splitMode === 'equal' && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <div>
                                    <div className="font-medium dark:text-white">Dividir igualmente</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Você e os selecionados dividem a conta
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSplitMode('reimbursement')}
                                className={`p-3 rounded border text-left flex items-center transition-colors ${splitMode === 'reimbursement'
                                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 ring-1 ring-teal-500'
                                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${splitMode === 'reimbursement' ? 'border-teal-500 bg-teal-500' : 'border-gray-400'
                                    }`}>
                                    {splitMode === 'reimbursement' && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <div>
                                    <div className="font-medium dark:text-white">Receber valor total</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        Os selecionados te devem o valor total
                                    </div>
                                </div>
                            </button>
                        </div>

                        <label className="block text-gray-700 dark:text-gray-300 mb-2">Com quem?</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 p-2 rounded">
                            {members.filter(m => m.userId !== paidBy).map(m => (
                                <div key={m.userId} className="flex items-center p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer" onClick={() => toggleMember(m.userId)}>
                                    <input
                                        type="checkbox"
                                        checked={selectedMembers.includes(m.userId)}
                                        onChange={() => { }} // Handled by parent div
                                        className="mr-3 h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                    />
                                    <span className="dark:text-gray-300">{m.user.name}</span>
                                </div>
                            ))}
                            {members.filter(m => m.userId !== paidBy).length === 0 && (
                                <p className="text-gray-500 dark:text-gray-400 text-sm italic">Nenhum outro membro no grupo.</p>
                            )}
                        </div>
                        {selectedMembers.length === 0 && <p className="text-red-500 text-sm mt-1">Selecione pelo menos uma pessoa.</p>}
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
