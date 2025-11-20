import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../routes/authRoutes';
import groupRoutes from '../routes/groupRoutes';
import prisma from '../utils/prisma';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);

describe('API Tests', () => {
    let token: string;
    let userId: string;
    let groupId: string;

    beforeAll(async () => {
        // Clean up
        await prisma.payment.deleteMany();
        await prisma.expenseShare.deleteMany();
        await prisma.expense.deleteMany();
        await prisma.groupMember.deleteMany();
        await prisma.group.deleteMany();
        await prisma.user.deleteMany();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should register a new user', async () => {
        const res = await request(app).post('/api/auth/register').send({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
        });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('userId');
        userId = res.body.userId;
    });

    it('should login', async () => {
        const res = await request(app).post('/api/auth/login').send({
            email: 'test@example.com',
            password: 'password123',
        });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        token = res.body.token;
    });

    it('should create a group', async () => {
        const res = await request(app)
            .post('/api/groups')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Test Group',
                description: 'Test Description',
            });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        groupId = res.body.id;
    });

    it('should get groups', async () => {
        const res = await request(app)
            .get('/api/groups')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });
});
