import { Router, type Response } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import prisma from "../prisma.js";



const router = Router();

// ==========================================
// BIDDING ENGINE ROUTES
// ==========================================

// 1. Place a Bid on an Open Job (ARTISANS ONLY)
router.post('/create', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const artisanUuid = (req.user as any).uuid;
        const userRole = (req.user as any).role;
        const { requestID, proposedPrice, message } = req.body;

        // Check: Only Artisans can bid
        if (userRole !== 'Artisan') {
            res.status(403).json({
                status: 'error',
                message: 'Access denied. Only vetted artisans can place bids.'
            });
            return;
        }

        // Validation Check
        if (!requestID || !proposedPrice || !message) {
            res.status(400).json({
                status: 'error',
                message: 'Missing required fields. Please provide requestID, proposedPrice, and message.'
            });
            return;
        }

        // Check 1: Does the job actually exist?
        const job = await prisma.service_Requests.findUnique({
            where: { RequestID: requestID }
        });

        if (!job) {
            res.status(404).json({ status: 'error', message: 'Service request not found.' });
            return;
        }

        // Check 2: Is the job still open?
        if (job.Status !== 'Open') {
            res.status(400).json({ status: 'error', message: 'This job is no longer open for bidding.' });
            return;
        }

        // Database Insert: Create the bid
        const newBid = await prisma.bids.create({
            data: {
                RequestID: requestID,
                ArtisanID: artisanUuid,
                ProposedPrice: proposedPrice, 
                Message: message
            }
        });

        res.status(201).json({
            status: 'success',
            message: 'Bid successfully placed!',
            data: newBid
        });

    } catch (error: any) {
        console.error("BID CREATION ERROR:", error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to place bid.'
        });
    }
});

// 2. Fetch all Bids for a Specific Job (CLIENTS ONLY)
router.get('/:jobId', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const clientUuid = (req.user as any).uuid;
        const userRole = (req.user as any).role;
        const { jobId } = req.params; // Grabbing the ID from the URL

        // Bouncer Check: Only Clients can review bids
        if (userRole !== 'Client') {
            res.status(403).json({
                status: 'error',
                message: 'Access denied. Only clients can view bids for their service requests.'
            });
            return;
        }

        // Check 1: Does the job exist, and does it actually belong to this client?
        const job = await prisma.service_Requests.findUnique({
            where: { RequestID: jobId as string }
        });

        if (!job) {
            res.status(404).json({ status: 'error', message: 'Service request not found.' });
            return;
        }

        if (job.ClientID !== clientUuid) {
            res.status(403).json({ 
                status: 'error', 
                message: 'Unauthorized. You can only view bids on your own jobs.' 
            });
            return;
        }

        // Database Query: Fetch bids and join the Artisan's Trust Score
        const bids = await prisma.bids.findMany({
            where: { RequestID: jobId as string },
            include: {
                Artisan: {
                    select: {
                        FullName: true,
                        WTA_Score: true,
                        KYC_Verified: true
                    }
                }
            },
            orderBy: {
                // Gamification: Sort by the highest Trust Score first!
                Artisan: {
                    WTA_Score: 'desc'
                }
            }
        });

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
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch bids.'
        });
    }
});

// 3. Client Decision (Accept or Counter a Bid)
router.post('/decision', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const clientUuid = (req.user as any).uuid;
        const userRole = (req.user as any).role;
        const { bidId, decision, counterAmount } = req.body;

        // Bouncer Check
        if (userRole !== 'Client') {
            res.status(403).json({ status: 'error', message: 'Access denied. Only clients can make decisions.' });
            return;
        }

        // Validation
        if (!bidId || !decision) {
            res.status(400).json({ status: 'error', message: 'Missing required fields: bidId and decision.' });
            return;
        }

        if (decision !== 'Accept' && decision !== 'Counter') {
            res.status(400).json({ status: 'error', message: "Decision must be exactly 'Accept' or 'Counter'." });
            return;
        }

        // Check 1: Does the bid exist, and can we see the parent job?
        const bid = await prisma.bids.findUnique({
            where: { BidID: bidId },
            include: { Service: true } // Pulling the parent job data!
        });

        if (!bid) {
            res.status(404).json({ status: 'error', message: 'Bid not found.' });
            return;
        }

        // Check 2: Does this client actually own the job? (Anti-hacking check)
        if (bid.Service.ClientID !== clientUuid) {
            res.status(403).json({ status: 'error', message: 'Unauthorized. You do not own this job posting.' });
            return;
        }

        // Check 3: Is the job still open?
        if (bid.Service.Status !== 'Open') {
            res.status(400).json({ status: 'error', message: 'This job is already assigned or closed.' });
            return;
        }

        // ==========================================
        // SCENARIO A: CLIENT ACCEPTS THE BID
        // ==========================================
        if (decision === 'Accept') {
            // Prisma Transaction: Update both tables atomically!
            const [updatedBid, updatedJob] = await prisma.$transaction([
                prisma.bids.update({
                    where: { BidID: bidId },
                    data: { BidStatus: 'Accepted' }
                }),
                prisma.service_Requests.update({
                    where: { RequestID: bid.RequestID },
                    data: { Status: 'Assigned' }
                })
            ]);

            res.status(200).json({
                status: 'success',
                message: 'Bid accepted! The job is officially assigned.',
                data: { bid: updatedBid, job: updatedJob }
            });
            return;
        }

        // ==========================================
        // SCENARIO B: CLIENT HAGGLES (COUNTER-OFFER)
        // ==========================================
        if (decision === 'Counter') {
            if (!counterAmount) {
                res.status(400).json({ status: 'error', message: 'You must provide a counterAmount to haggle.' });
                return;
            }

            const updatedBid = await prisma.bids.update({
                where: { BidID: bidId },
                data: {
                    BidStatus: 'Counter_Offered',
                    CounterAmount: counterAmount
                }
            });

            res.status(200).json({
                status: 'success',
                message: 'Counter offer successfully sent to the artisan!',
                data: updatedBid
            });
            return;
        }

    } catch (error: any) {
        console.error("BID DECISION ERROR:", error.message);
        res.status(500).json({ status: 'error', message: 'Failed to process bid decision.' });
    }
});

export default router;