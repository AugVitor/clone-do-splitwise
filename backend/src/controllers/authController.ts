import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { z } from 'zod';

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = registerSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
            },
        });

        res.status(201).json({ message: 'User created successfully', userId: user.id });
    } catch (error) {
        res.status(400).json({ message: 'Invalid data', error });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '7d',
        });

        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(400).json({ message: 'Invalid data', error });
    }
};

export const getMe = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, createdAt: true },
    });

    res.json(user);
};
