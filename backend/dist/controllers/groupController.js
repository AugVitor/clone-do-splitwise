"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBalances = exports.createPayment = exports.getExpenses = exports.createExpense = exports.addMember = exports.getGroupDetails = exports.getGroups = exports.createGroup = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const zod_1 = require("zod");
// Schemas
const createGroupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
});
const addMemberSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
const createExpenseSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    amount: zod_1.z.number().positive(),
    paidByUserId: zod_1.z.string().uuid(),
    participants: zod_1.z.array(zod_1.z.object({
        userId: zod_1.z.string().uuid(),
        shareAmount: zod_1.z.number().positive(),
    })).min(1),
    note: zod_1.z.string().optional(),
});
const createPaymentSchema = zod_1.z.object({
    toUserId: zod_1.z.string().uuid(),
    amount: zod_1.z.number().positive(),
    note: zod_1.z.string().optional(),
});
// Controllers
const createGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const userId = req.user.userId;
    try {
        const { name, description } = createGroupSchema.parse(req.body);
        const group = yield prisma_1.default.group.create({
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
    }
    catch (error) {
        res.status(400).json({ error });
    }
});
exports.createGroup = createGroup;
const getGroups = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const userId = req.user.userId;
    const groups = yield prisma_1.default.group.findMany({
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
});
exports.getGroups = getGroups;
const getGroupDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // @ts-ignore
    const userId = req.user.userId;
    const group = yield prisma_1.default.group.findUnique({
        where: { id },
        include: {
            members: {
                include: { user: { select: { id: true, name: true, email: true } } },
            },
        },
    });
    if (!group)
        return res.status(404).json({ message: 'Group not found' });
    // Check membership
    const isMember = group.members.some(m => m.userId === userId);
    if (!isMember)
        return res.status(403).json({ message: 'Not a member' });
    res.json(group);
});
exports.getGroupDetails = getGroupDetails;
const addMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const { email } = addMemberSchema.parse(req.body);
        const userToAdd = yield prisma_1.default.user.findUnique({ where: { email } });
        if (!userToAdd)
            return res.status(404).json({ message: 'User not found' });
        // Check if already member
        const existingMember = yield prisma_1.default.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId: id,
                    userId: userToAdd.id,
                },
            },
        });
        if (existingMember)
            return res.status(400).json({ message: 'User already in group' });
        yield prisma_1.default.groupMember.create({
            data: {
                groupId: id,
                userId: userToAdd.id,
            },
        });
        res.json({ message: 'Member added', user: userToAdd });
    }
    catch (error) {
        res.status(400).json({ error });
    }
});
exports.addMember = addMember;
const createExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const { title, amount, paidByUserId, participants, note } = createExpenseSchema.parse(req.body);
        // Validate total shares match amount (roughly)
        const totalShares = participants.reduce((sum, p) => sum + p.shareAmount, 0);
        if (Math.abs(totalShares - amount) > 0.01) {
            return res.status(400).json({ message: 'Shares do not sum to total amount' });
        }
        const expense = yield prisma_1.default.expense.create({
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
    }
    catch (error) {
        res.status(400).json({ error });
    }
});
exports.createExpense = createExpense;
const getExpenses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const expenses = yield prisma_1.default.expense.findMany({
        where: { groupId: id },
        include: {
            paidBy: { select: { id: true, name: true } },
            shares: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: { date: 'desc' },
    });
    res.json(expenses);
});
exports.getExpenses = getExpenses;
const createPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // @ts-ignore
    const fromUserId = req.user.userId;
    try {
        const { toUserId, amount, note } = createPaymentSchema.parse(req.body);
        const payment = yield prisma_1.default.payment.create({
            data: {
                groupId: id,
                fromUserId,
                toUserId,
                amount,
                note,
            },
        });
        res.status(201).json(payment);
    }
    catch (error) {
        res.status(400).json({ error });
    }
});
exports.createPayment = createPayment;
const getBalances = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    // Fetch all expenses and payments for the group
    const expenses = yield prisma_1.default.expense.findMany({
        where: { groupId: id },
        include: { shares: true },
    });
    const payments = yield prisma_1.default.payment.findMany({
        where: { groupId: id },
    });
    const members = yield prisma_1.default.groupMember.findMany({
        where: { groupId: id },
        include: { user: { select: { id: true, name: true } } },
    });
    // Calculate balances
    const balances = {};
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
});
exports.getBalances = getBalances;
