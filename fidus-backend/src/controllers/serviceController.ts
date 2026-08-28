import { type Response } from "express";
import { type AuthRequest } from "../middleware/auth.js";
import * as ServiceRequestsService from "../services/serviceRequests.js";

export const createServiceRequest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const clientUuid = req.user!.uuid;
        const clientRole = req.user!.role;
        const { Description, LocationCoordinates, PriceRange } = req.body;

        if (clientRole !== 'Client') {
            res.status(403).json({
                status: "error",
                message: "Access denied. Only registered clients can create service requests."
            });
            return;
        }

        const newServiceRequest = await ServiceRequestsService.createServiceRequest(
            clientUuid, Description, LocationCoordinates, PriceRange
        );

        res.status(201).json({
            status: "success",
            message: "Service request broadcasted successfully!", 
            data: newServiceRequest
        });
    } catch (error: any) {
        console.error("SERVICE CREATION ERROR:", error.message);
        res.status(500).json({
            status: "error",
            message: "Failed to create service request."
        });
    }
};

export const getOpenServiceRequests = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userRole = req.user!.role;

        if (userRole !== 'Artisan') {
            res.status(403).json({
                status: 'error',
                message: 'Access denied. Only registered artisans can view the open job feed.'
            });
            return;
        }

        const openJobs = await ServiceRequestsService.getOpenServiceRequests();

        if (openJobs.length === 0) {
            res.status(200).json({
                status: 'success',
                message: 'No open jobs at the moment. Check back later!',
                data: []
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            message: `Found ${openJobs.length} open service request(s)!`,
            data: openJobs
        });
    } catch (error: any) {
        console.error("FETCH OPEN JOBS ERROR:", error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch open jobs.'
        });
    }
};

export const getMyServiceRequests = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userUuid = req.user!.uuid;
        const userRole = req.user!.role;

        if (userRole !== 'Client') {
            res.status(403).json({
                status: 'error',
                message: 'Access denied. Only clients can view their posted requests here.'
            });
            return;
        }

        const myJobs = await ServiceRequestsService.getMyServiceRequests(userUuid);

        if (myJobs.length === 0) {
            res.status(200).json({
                status: 'success',
                message: 'You have not posted any service requests yet.',
                data: []
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            message: `Found ${myJobs.length} of your service request(s).`,
            data: myJobs
        });
    } catch (error: any) {
        console.error("FETCH MY JOBS ERROR:", error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch your jobs.'
        });
    }
};

export const completeServiceRequest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userUuid = req.user!.uuid;
        const userRole = req.user!.role;
        const jobId = req.params.jobId as string;

        const result = await ServiceRequestsService.handleServiceCompletionHandshake(jobId, userUuid, userRole);

        if (result.complete) {
            res.status(200).json({
                status: 'success',
                message: 'Handshake complete! Job closed, escrow funds released, and WTA updated!',
                data: { 
                    job: result.finalizedJob, 
                    escrow: result.releasedEscrow, 
                    wta_metrics: result.wtaMetrics 
                }
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            message: `${userRole} completion registered. Waiting for the other party to confirm.`,
            data: result.updatedJob
        });

    } catch (error: any) {
        console.error("HANDSHAKE ERROR:", error.message);
        
        switch (error.message) {
            case 'NOT_FOUND':
                res.status(404).json({ status: 'error', message: 'Job not found.' });
                return;
            case 'INVALID_STATUS':
                res.status(400).json({ status: 'error', message: 'Only assigned jobs can be marked as completed.' });
                return;
            case 'NO_ACCEPTED_BID':
                res.status(500).json({ status: 'error', message: 'No accepted bid found for this assigned job.' });
                return;
            case 'UNAUTHORIZED_CLIENT':
                res.status(403).json({ status: 'error', message: 'You do not own this job.' });
                return;
            case 'UNAUTHORIZED_ARTISAN':
                res.status(403).json({ status: 'error', message: 'You are not the assigned artisan for this job.' });
                return;
            case 'INVALID_ROLE':
                res.status(403).json({ status: 'error', message: 'Invalid role for this action.' });
                return;
            default:
                res.status(500).json({ status: 'error', message: 'Failed to process completion handshake.' });
                return;
        }
    }
};
