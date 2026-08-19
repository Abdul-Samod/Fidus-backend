import { Router, type Response } from "express";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Database Connection Setup
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const router = Router();

// ==============================
// SERVICE REQUEST ROUTES
// ==============================

// 1. Create a New Service Request (Clients)
router.post('/create', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const clientUuid = (req.user as any).uuid;
        const clientRole = (req.user as any).role;
        const { Description, LocationCoordinates, PriceRange } = req.body;

        // User Role Check: Only Clients can post jobs
        if (clientRole !== 'Client') {
            res.status(403).json({
                status: "error",
                message: "Access denied. Only registered clients can create service requests."
            });
            return;
        }

        // Validation Check
        if (!Description || !LocationCoordinates || !PriceRange) {
            res.status(400).json({
                status: "error",
                message: "Missing required fields. Please provide a Description, LocationCoordinates, and PriceRange."
            });
            return;
        }

        // Database Insert: Creating the gig
        const newServiceRequest = await prisma.service_Requests.create({
            data: {
                ClientID: clientUuid,
                Description: Description,
                LocationCoordinates: LocationCoordinates,
                PriceRange: PriceRange,
                Status: 'Open' // Automatically defaults to Open to be vsisble to artisans
            }
        });

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
});

// 2. Fetch all Open Service Requests (THE ARTISAN JOB FEED)
router.get('/open', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userRole = (req.user as any).role;

        // Check: Only Artisans get to see the global job feed
        if (userRole !== 'Artisan') {
            res.status(403).json({
                status: 'error',
                message: 'Access denied. Only registered artisans can view the open job feed.'
            });
            return;
        }

        // Query the database for all gigs that haven't been assigned yet
        const openJobs = await prisma.service_Requests.findMany({
            where: {
                Status: 'Open'
            },
            orderBy: {
                // Shows the newest jobs at the top of the feed
                RequestID: 'desc' 
            }
        });

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
});

// 3. Fetch My Service Requests (Client Dashboard)
router.get('/my-requests', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userUuid = (req.user as any).uuid;
        const userRole = (req.user as any).role;

        // Check: This route is only for Clients to track jobs they posted
        if (userRole !== 'Client') {
            res.status(403).json({
                status: 'error',
                message: 'Access denied. Only clients can view their posted requests here.'
            });
            return;
        }

        // Query the database for jobs specifically created by this Client
        const myJobs = await prisma.service_Requests.findMany({
            where: {
                ClientID: userUuid
            },
            orderBy: {
                RequestID: 'desc' // Newest jobs at the top
            }
        });

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
});
export default router;