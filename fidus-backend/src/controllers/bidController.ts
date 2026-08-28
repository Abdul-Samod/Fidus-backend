import { type Request, type Response } from "express";
import { type AuthRequest } from "../middleware/auth.js";
import * as bidService from "../services/bidService.js";

export const placeBid = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const artisanUuid = req.user!.uuid;
        const userRole = req.user!.role;
        const { requestID, proposedPrice, message } = req.body;

        if (userRole !== 'Artisan') {
            res.status(403).json({
                status: 'error',
                message: 'Access denied. Only vetted artisans can place bids.'
            });
            return;
        }

        const newBid = await bidService.placeBid(artisanUuid, requestID, proposedPrice, message);

        res.status(201).json({
            status: 'success',
            message: 'Bid successfully placed!',
            data: newBid
        });

    } catch (error: any) {
        console.error("BID CREATION ERROR:", error.message);
        if (error.message === "JOB_NOT_FOUND") {
            res.status(404).json({ status: 'error', message: 'Service request not found.' });
            return;
        }
        if (error.message === "JOB_NOT_OPEN") {
            res.status(400).json({ status: 'error', message: 'This job is no longer open for bidding.' });
            return;
        }
        res.status(500).json({ status: 'error', message: 'Failed to place bid.' });
    }
};

export const getBidsForJob = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const clientUuid = req.user!.uuid;
        const userRole = req.user!.role;
        const jobId = req.params.jobId as string; 

        if (userRole !== 'Client') {
            res.status(403).json({
                status: 'error',
                message: 'Access denied. Only clients can view bids for their service requests.'
            });
            return;
        }

        const bids = await bidService.getBidsForJob(clientUuid, jobId);

        if (bids.length === 0) {
            res.status(200).json({
                status: 'success',
                message: 'No bids yet. Hang tight!',
                data: []
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            message: `Found ${bids.length} bid(s) for this job.`,
            data: bids
        });

    } catch (error: any) {
        console.error("FETCH BIDS ERROR:", error.message);
        if (error.message === "JOB_NOT_FOUND") {
            res.status(404).json({ status: 'error', message: 'Service request not found.' });
            return;
        }
        if (error.message === "UNAUTHORIZED_CLIENT") {
            res.status(403).json({ status: 'error', message: 'Unauthorized. You can only view bids on your own jobs.' });
            return;
        }
        res.status(500).json({ status: 'error', message: 'Failed to fetch bids.' });
    }
};

export const makeBidDecision = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const clientUuid = req.user!.uuid;
        const userRole = req.user!.role;
        const { bidId, decision, counterAmount } = req.body;

        if (userRole !== 'Client') {
            res.status(403).json({ status: 'error', message: 'Access denied. Only clients can make decisions.' });
            return;
        }

        const result = await bidService.makeBidDecision(clientUuid, bidId, decision, counterAmount);

        if (result.type === 'Accept') {
            res.status(200).json({
                status: 'success',
                message: 'Bid accepted! The job is officially assigned.',
                data: { bid: result.updatedBid, job: result.updatedJob }
            });
            return;
        }

        if (result.type === 'Counter') {
            res.status(200).json({
                status: 'success',
                message: 'Counter offer successfully sent to the artisan!',
                data: result.updatedBid
            });
            return;
        }

    } catch (error: any) {
        console.error("BID DECISION ERROR:", error.message);
        if (error.message === "BID_NOT_FOUND") {
            res.status(404).json({ status: 'error', message: 'Bid not found.' });
            return;
        }
        if (error.message === "UNAUTHORIZED_CLIENT") {
            res.status(403).json({ status: 'error', message: 'Unauthorized. You do not own this job posting.' });
            return;
        }
        if (error.message === "JOB_NOT_OPEN") {
            res.status(400).json({ status: 'error', message: 'This job is already assigned or closed.' });
            return;
        }
        res.status(500).json({ status: 'error', message: 'Failed to process bid decision.' });
    }
};
