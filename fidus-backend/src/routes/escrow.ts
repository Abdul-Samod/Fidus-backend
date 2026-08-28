import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { verifyEscrowSchema } from '../validators/escrowValidators.js';
import * as escrowController from '../controllers/escrowController.js';

const router = Router();

router.post(
    '/verify', 
    requireAuth, 
    validate(verifyEscrowSchema),
    escrowController.verifyTransaction
);

export default router;