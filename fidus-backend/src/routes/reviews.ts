import { Router, type Response } from "express";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { updateArtisanWTA } from "../services/wtaService.js"; 
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg"; 
import { Pool } from "pg"; 

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const router = Router();

// ======================
// REVIEWS 
// ======================

router.post('/create', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const clientUuid = (req.user as any).uuid;
        const userRole = (req.user as any).role;
        const { requestID, artisanID, rating, comment } = req.body;

        // Check
        if (userRole !== 'Client') {
            res.status(403).json({ status: 'error', message: 'Only clients can leave reviews.' });
            return;
        }

        // 1. Fetch the job from the database
        const job = await prisma.service_Requests.findUnique({
            where: { RequestID: requestID }
        });

        // 2. Make sure the job exists and belongs to this exact client
        if (!job) {
            res.status(404).json({ status: 'error', message: 'Service request not found.' });
            return;
        }

        if (job.ClientID !== clientUuid) {
            res.status(403).json({ status: 'error', message: 'Unauthorized. You can only review your own jobs.' });
            return;
        }

        // 3. Ensure the job is completed
        if (job.Status !== 'Completed') {
            res.status(400).json({ 
                status: 'error', 
                message: 'You can only leave a review after the job has been officially marked as completed.' 
            });
            return;
        }

        // Validation
        if (!requestID || !artisanID || rating === undefined || rating < 1 || rating > 5) {
            res.status(400).json({ status: 'error', message: 'Valid requestID, artisanID, and a rating (1-5) are required.' });
            return;
        }

        // 1. Insert the Review into the database
        const newReview = await prisma.reviews.create({
            data: {
                RequestID: requestID,
                ClientID: clientUuid,
                ArtisanID: artisanID,
                Rating: rating,
                Comment: comment || ""
            }
        });

        // 2. Trigger the WTA recalculation for the artisan
        const wtaMetrics = await updateArtisanWTA(artisanID);

        // 3. Send the response
        res.status(201).json({
            status: 'success',
            message: 'Review successfully processed and WTA score recalculated!',
            data: {
                review: newReview,
                wta_metrics: wtaMetrics
            }
        });

    } catch (error: any) {
        console.error("REVIEW CREATION ERROR:", error.message);
        res.status(500).json({ status: 'error', message: 'Failed to process review.' });
    }
});

export default router;