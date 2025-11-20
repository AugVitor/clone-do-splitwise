import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { z } from 'zod';

// Schemas
const createGroupSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
});

const addMemberSchema = z.object({
    email: z.string().email(),
});

const createExpenseSchema = z.object({
    title: z.string().min(1),
    amount: z.number().positive(),
    paidByUserId: z.string().uuid(),
    participants: z.array(z.object({
        userId: z.string().uuid(),
        shareAmount: z.number().positive(),
    })).min(1),
    note: z.string().optional(),
});

const createPaymentSchema = z.object({
    toUserId: z.string().uuid(),
    amount: z.number().positive(),
    note: z.string().optional(),
});

// Controllers
export const createGroup = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.userId;
    try {
        const { name, description } = createGroupSchema.parse(req.body);

        const group = await prisma.group.create({
            data: {
                name,
                description,
                ownerId: userId,
                members: {
                    create: { userId },
                },
            },
        });

        res.status(201).json(group);
    } catch (error) {
        res.status(400).json({ error });
    }
};

export const getGroups = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user.userId;
    const groups = await prisma.group.findMany({
        where: {
            members: {
                some: { userId },
            },
        },
        include: {
            _count: {
                select: { members: true },
            },
        },
    });
    res.json(groups);
};

export const getGroupDetails = async (req: Request, res: Response) => {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user.userId;

    const group = await prisma.group.findUnique({
        where: { id },
        include: {
            members: {
                include: { user: { select: { id: true, name: true, email: true } } },
            },
        },
    });

    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Check membership
    const isMember = group.members.some(m => m.userId === userId);
    if (!isMember) return res.status(403).json({ message: 'Not a member' });

    res.json(group);
};

export const addMember = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const { email } = addMemberSchema.parse(req.body);

        const userToAdd = await prisma.user.findUnique({ where: { email } });
        if (!userToAdd) return res.status(404).json({ message: 'User not found' });

        // Check if already member
        const existingMember = await prisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId: id,
                    userId: userToAdd.id,
                },
            },
        });

        if (existingMember) return res.status(400).json({ message: 'User already in group' });

        await prisma.groupMember.create({
            data: {
                groupId: id,
                userId: userToAdd.id,
            },
        });

        res.json({ message: 'Member added', user: userToAdd });
    } catch (error) {
        res.status(400).json({ error });
    }
};

export const createExpense = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const { title, amount, paidByUserId, participants, note } = createExpenseSchema.parse(req.body);

        // Validate total shares match amount (roughly)
        const totalShares = participants.reduce((sum, p) => sum + p.shareAmount, 0);
        if (Math.abs(totalShares - amount) > 0.01) {
            return res.status(400).json({ message: 'Shares do not sum to total amount' });
        }

        const expense = await prisma.expense.create({
            data: {
                groupId: id,
                title,
                amount,
                paidByUserId,
                note,
                shares: {
                    create: participants.map(p => ({
                        userId: p.userId,
                        shareAmount: p.shareAmount,
                    })),
                },
            },
        });

        res.status(201).json(expense);
    } catch (error) {
        res.status(400).json({ error });
    }
};

export const getExpenses = async (req: Request, res: Response) => {
    const { id } = req.params;
    const expenses = await prisma.expense.findMany({
        where: { groupId: id },
        include: {
            paidBy: { select: { id: true, name: true } },
            shares: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: { date: 'desc' },
    });
    res.json(expenses);
};

export const createPayment = async (req: Request, res: Response) => {
    const { id } = req.params;
    // @ts-ignore
    const fromUserId = req.user.userId;

    try {
        const { toUserId, amount, note } = createPaymentSchema.parse(req.body);

        const payment = await prisma.payment.create({
            data: {
                groupId: id,
                fromUserId,
                toUserId,
                amount,
                note,
            },
        });

        res.status(201).json(payment);
    } catch (error) {
        res.status(400).json({ error });
    }
};

export const getBalances = async (req: Request, res: Response) => {
    const { id } = req.params;

    // Fetch all expenses and payments for the group
    const expenses = await prisma.expense.findMany({
        where: { groupId: id },
        include: { shares: true },
    });

    const payments = await prisma.payment.findMany({
        where: { groupId: id },
    });

    const members = await prisma.groupMember.findMany({
        where: { groupId: id },
        include: { user: { select: { id: true, name: true } } },
    });

    // Calculate balances
    const balances: Record<string, number> = {};
    members.forEach(m => {
        balances[m.userId] = 0;
    });

    // Process expenses
    expenses.forEach(expense => {
        const payerId = expense.paidByUserId;
        const amount = Number(expense.amount);

        // Payer gets +amount (they are owed this much)
        if (balances[payerId] !== undefined) {
            balances[payerId] += amount;
        }

        // Each participant owes their share (subtract from their balance)
        expense.shares.forEach(share => {
            const shareAmount = Number(share.shareAmount);
            if (balances[share.userId] !== undefined) {
                balances[share.userId] -= shareAmount;
            }
        });
    });

    // Process payments
    payments.forEach(payment => {
        const amount = Number(payment.amount);
        // Sender pays, so their balance increases (debt decreases)
        if (balances[payment.fromUserId] !== undefined) {
            balances[payment.fromUserId] += amount;
        }
        // Receiver gets paid, so their balance decreases (credit decreases)
        if (balances[payment.toUserId] !== undefined) {
            balances[payment.toUserId] -= amount;
        }
    });

    // Format for response
    const result = members.map(m => ({
        userId: m.userId,
        user: m.user,
        balance: balances[m.userId] || 0,
    }));

    res.json(result);
};
