import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createServiceRequestSchema, completeServiceRequestSchema } from "../validators/serviceValidators.js";
import * as serviceController from "../controllers/serviceController.js";

const router = Router();

// ==============================
// SERVICE REQUEST ROUTES
// ==============================

// 1. Create a New Service Request (Clients)
router.post(
    '/create', 
    requireAuth, 
    validate(createServiceRequestSchema), 
    serviceController.createServiceRequest
);

// 2. Fetch all Open Service Requests (THE ARTISAN JOB FEED)
router.get(
    '/open', 
    requireAuth, 
    serviceController.getOpenServiceRequests
);

// 3. Fetch My Service Requests (Client Dashboard)
router.get(
    '/my-requests', 
    requireAuth, 
    serviceController.getMyServiceRequests
);

// 4. THE 2-PARTY COMPLETION HANDSHAKE (Client + Artisan)
router.post(
    '/:jobId/complete', 
    requireAuth, 
    validate(completeServiceRequestSchema),
    serviceController.completeServiceRequest
);

export default router;