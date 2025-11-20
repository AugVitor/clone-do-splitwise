import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import groupRoutes from './routes/groupRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);

app.get('/', (req, res) => {
    res.send('Splitwise Clone API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
