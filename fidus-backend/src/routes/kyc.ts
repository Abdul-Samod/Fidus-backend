import { Router, type Response } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { url } from 'node:inspector';

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
(req: AuthRequest, res: Response): void => {
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

    // Send the URL back to client to confirm success
    res.status(200).json({
        status: "success",
        message: "NIN successfully uploaded to the cloud!",
        url: secureUrl,
        user: req.user
    }) ;
});

export default router;