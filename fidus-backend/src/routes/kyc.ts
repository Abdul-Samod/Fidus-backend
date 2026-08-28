import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import * as kycController from '../controllers/kycController.js';

const router = Router();

router.get('/status', requireAuth, kycController.getStatus);

// KYC document upload (NIN) 
router.post(
    '/upload-nin', 
    requireAuth, 
    upload.single('nin_document'), 
    kycController.uploadNIN
);

// BUSINESS CERT & PROFILE PIC ROUTES (OPTIONAL - TO INCREASE WTA SCORE)

// Upload Profile Picture (+10 WTA Score)
router.post(
    '/upload-profile-pic', 
    requireAuth, 
    upload.single('profile_picture'), 
    kycController.uploadProfilePic
);

// Upload Business Certificate (+20 WTA Score)
router.post(
    '/upload-business-cert', 
    requireAuth, 
    upload.single('business_certificate'), 
    kycController.uploadBusinessCert
);

export default router;