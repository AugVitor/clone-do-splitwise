import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
    createGroup,
    getGroups,
    getGroupDetails,
    addMember,
    createExpense,
    getExpenses,
    createPayment,
    getBalances
} from '../controllers/groupController';

const router = Router();

router.use(authenticateToken);

router.post('/', createGroup);
router.get('/', getGroups);
router.get('/:id', getGroupDetails);
router.post('/:id/members', addMember);
router.post('/:id/expenses', createExpense);
router.get('/:id/expenses', getExpenses);
router.post('/:id/payments', createPayment);
router.get('/:id/balances', getBalances);

export default router;
