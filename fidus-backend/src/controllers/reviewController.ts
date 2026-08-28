import { type Response } from "express";
import { type AuthRequest } from "../middleware/auth.js";
import * as reviewService from "../services/reviewService.js";

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const clientUuid = req.user!.uuid;
        const userRole = req.user!.role;
        const { requestID, artisanID, rating, comment } = req.body;

        if (userRole !== 'Client') {
            res.status(403).json({ status: 'error', message: 'Only clients can leave reviews.' });
            return;
        }

        const data = await reviewService.createReview(clientUuid, requestID, artisanID, rating, comment);

        res.status(201).json({
            status: 'success',
            message: 'Review successfully processed and WTA score recalculated!',
            data
        });

    } catch (error: any) {
        console.error("REVIEW CREATION ERROR:", error.message);
        if (error.message === 'JOB_NOT_FOUND') {
            res.status(404).json({ status: 'error', message: 'Service request not found.' });
            return;
        }
        if (error.message === 'UNAUTHORIZED_CLIENT') {
            res.status(403).json({ status: 'error', message: 'Unauthorized. You can only review your own jobs.' });
            return;
        }
        if (error.message === 'JOB_NOT_COMPLETED') {
            res.status(400).json({ 
                status: 'error', 
                message: 'You can only leave a review after the job has been officially marked as completed.' 
            });
            return;
        }
        res.status(500).json({ status: 'error', message: 'Failed to process review.' });
    }
};
