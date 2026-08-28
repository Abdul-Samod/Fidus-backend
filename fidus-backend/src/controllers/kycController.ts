import { type Response } from "express";
import { type AuthRequest } from "../middleware/auth.js";
import { uploadToCloudinary } from "../middleware/upload.js";
import * as kycService from "../services/kycService.js";

export const getStatus = (req: AuthRequest, res: Response) => {
    res.status(200).json({
        status: 'success',
        message: 'Access Granted to KYC route',
        user: req.user
    });
};

export const uploadNIN = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({
                status: "error",
                message: "No document found. Please attach your NIN image.",
            });
            return;
        }

        const uploadResult = await uploadToCloudinary(req.file.buffer, 'fidus_kyc_uploads');
        const secureUrl = uploadResult.secure_url;
        const artisanUuid = req.user!.uuid;

        const kycRecord = await kycService.uploadNIN(artisanUuid, secureUrl);

        res.status(200).json({
            status: "success",
            message: "NIN successfully uploaded and secured in the database!",
            data: { url: secureUrl, kycStatus: kycRecord }
        });
    } catch (error: any) {
        console.error("NIN UPLOAD ERROR:", error.message);
        res.status(500).json({ status: 'error', message: 'Failed to save document to the database.' });
    }
};

export const uploadProfilePic = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ status: "error", message: "No image found. Please attach a profile picture." });
            return;
        }

        const uploadResult = await uploadToCloudinary(req.file.buffer, 'fidus_kyc_uploads');
        const secureUrl = uploadResult.secure_url;
        const artisanUuid = req.user!.uuid;

        const kycRecord = await kycService.uploadProfilePic(artisanUuid, secureUrl);

        res.status(200).json({
            status: "success",
            message: "Profile picture uploaded! +10 Trust Score added.",
            data: { url: secureUrl, kycStatus: kycRecord }
        });
    } catch (error: any) {
        console.error("PROFILE PIC UPLOAD ERROR:", error.message);
        res.status(500).json({ status: 'error', message: 'Failed to upload profile picture.' });
    }
};

export const uploadBusinessCert = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ status: "error", message: "No document found. Please attach a business certificate." });
            return;
        }

        const uploadResult = await uploadToCloudinary(req.file.buffer, 'fidus_kyc_uploads');
        const secureUrl = uploadResult.secure_url;
        const artisanUuid = req.user!.uuid;

        const kycRecord = await kycService.uploadBusinessCert(artisanUuid, secureUrl);

        res.status(200).json({
            status: "success",
            message: "Business certificate verified! +20 Trust Score added.",
            data: { url: secureUrl, kycStatus: kycRecord }
        });
    } catch (error: any) {
        console.error("BUSINESS CERT UPLOAD ERROR:", error.message);
        res.status(500).json({ status: 'error', message: 'Failed to upload business certificate.' });
    }
};
