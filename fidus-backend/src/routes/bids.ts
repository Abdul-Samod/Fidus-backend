import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createBidSchema, getBidsSchema, bidDecisionSchema, artisanAcceptCounterSchema } from '../validators/bidValidators.js';
import * as bidController from '../controllers/bidController.js';

const router = Router();

// ==========================================
// BIDDING ENGINE ROUTES
// ==========================================

// 1. Place a Bid on an Open Job (ARTISANS ONLY)
router.post(
    '/create', 
    requireAuth, 
    validate(createBidSchema), 
    bidController.placeBid
);

// 2. Fetch all Bids for a Specific Job (CLIENTS ONLY)
router.get(
    '/:jobId', 
    requireAuth, 
    validate(getBidsSchema), 
    bidController.getBidsForJob
);

// 3. Client Decision (Accept, Counter, Reject)
router.post(
    '/decision', 
    requireAuth, 
    validate(bidDecisionSchema), 
    bidController.makeBidDecision
);

// 4. Artisan Accept Counter Offer
router.post(
    '/artisan-accept',
    requireAuth,
    validate(artisanAcceptCounterSchema),
    bidController.artisanAcceptCounter
);

export default router;