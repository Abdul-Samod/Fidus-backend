import { Router, type Response } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/status', requireAuth, (req: AuthRequest, res: Response) => {
    res.status(200).json({
        status: 'success',
        message: 'Access Granted to KYC route',
        user: req.user
    });
});

export default router;