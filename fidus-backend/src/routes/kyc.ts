import { Router, type Response } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import prisma from "../prisma.js";



const router = Router();

router.get('/status', requireAuth, (req: AuthRequest, res: Response) => {
    res.status(200).json({
        status: 'success',
        message: 'Access Granted to KYC route',
        user: req.user
    });
});

// KYC document upload (NIN) 
router.post('/upload-nin', requireAuth, upload.single('nin_document'), 
async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Validation: No file attached
        if (!req.file) {
            res.status(400).json({
                status: "error",
                message: "No document found. Please attach your NIN image.",
            });
            return;
        }

        // Cloudinary puts URL inside file path
        const secureUrl = req.file.path;
        
        // Grab the Artisan's UUID from the decoded token
        const artisanUuid = (req.user as any).uuid;

        // Database Upsert Logic: Create or Update the KYC record
        const kycRecord = await prisma.kycSubmission.upsert({
            where: { 
                userUuid: artisanUuid 
            },
            update: { 
                ninUrl: secureUrl 
            },
            create: { 
                userUuid: artisanUuid, 
                ninUrl: secureUrl 
            }
        });

        // Upgrade the Artisan's Trust score in the main Users table
        await prisma.users.update({
            where: { uuid: artisanUuid },
            data: {
                KYC_Verified: true,
                WTA_Score: 100.0
            }
        });

        // Send the new database success response
        res.status(200).json({
            status: "success",
            message: "NIN successfully uploaded and secured in the database!",
            data: {
                url: secureUrl,
                kycStatus: kycRecord
            }
        });
    } catch (error: any) {
        console.error("DATABASE SAVE ERROR:", error.message);
        res.status(500).json({
            status: 'error',
            message: 'Failed to save document to the database.',
        });
    }
});

// BUSINESS CERT & PROFILE PIC ROUTES (OPTIONAL - TO INCREASE WTA SCORE)

// Upload Profile Picture (+10 WTA Score)
router.post('/upload-profile-pic', requireAuth, upload.single('profile_picture'), 
async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ status: "error", message: "No image found. Please attach a profile picture." });
            return;
        }

        const secureUrl = req.file.path;
        const artisanUuid = (req.user as any).uuid;

        // Upsert the KYC record
        const kycRecord = await prisma.kycSubmission.upsert({
            where: { userUuid: artisanUuid },
            update: { profilePicUrl: secureUrl },
            create: { userUuid: artisanUuid, profilePicUrl: secureUrl }
        });

        // Increase the WTA Score by 10
        await prisma.users.update({
            where: { uuid: artisanUuid },
            data: { WTA_Score: { increment: 10.0 } }
        });

        res.status(200).json({
            status: "success",
            message: "Profile picture uploaded! +10 Trust Score added.",
            data: { url: secureUrl, kycStatus: kycRecord }
        });
    } catch (error: any) {
        console.error("PROFILE PIC UPLOAD ERROR:", error.message);
        res.status(500).json({ status: 'error', message: 'Failed to upload profile picture.' });
    }
});

// Upload Business Certificate (+20 WTA Score)
router.post('/upload-business-cert', requireAuth, upload.single('business_certificate'), 
async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ status: "error", message: "No document found. Please attach a business certificate." });
            return;
        }

        const secureUrl = req.file.path;
        const artisanUuid = (req.user as any).uuid;

        // Upsert the KYC record
        const kycRecord = await prisma.kycSubmission.upsert({
            where: { userUuid: artisanUuid },
            update: { businessCert: secureUrl },
            create: { userUuid: artisanUuid, businessCert: secureUrl }
        });

        // Increase the WTA Score by 20
        await prisma.users.update({
            where: { uuid: artisanUuid },
            data: { WTA_Score: { increment: 20.0 } }
        });

        res.status(200).json({
            status: "success",
            message: "Business certificate verified! +20 Trust Score added.",
            data: { url: secureUrl, kycStatus: kycRecord }
        });
    } catch (error: any) {
        console.error("BUSINESS CERT UPLOAD ERROR:", error.message);
        res.status(500).json({ status: 'error', message: 'Failed to upload business certificate.' });
    }
});

export default router;