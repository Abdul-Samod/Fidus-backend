import { type Request, type Response } from "express";
import { type AuthRequest } from "../middleware/auth.js";
import * as escrowService from "../services/escrowService.js";

export const verifyTransaction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const clientUuid = req.user!.uuid;
        const { reference, requestId, bidId } = req.body;

        const result = await escrowService.verifyTransaction(clientUuid, reference, requestId, bidId);

        res.status(200).json({
            status: 'success',
            message: 'Payment verified, funds locked in escrow, and job assigned!',
            data: result
        });

    } catch (error: any) {
        console.error("ESCROW VERIFICATION ERROR:", error.message);
        if (error.message === 'UNAUTHORIZED_CLIENT') {
            res.status(403).json({ status: 'error', message: 'You do not have permission to process this payment.' });
            return;
        }
        if (error.message === 'PAYMENT_FAILED') {
            res.status(400).json({ status: 'error', message: 'Payment verification failed.' });
            return;
        }
        if (error.message === 'BID_NOT_FOUND') {
            res.status(404).json({ status: 'error', message: 'Bid not found.' });
            return;
        }
        if (error.message === 'AMOUNT_MISMATCH') {
            res.status(400).json({ status: 'error', message: 'Payment amount mismatch. Possible tampering detected.' });
            return;
        }
        res.status(500).json({ status: 'error', message: 'Failed to verify transaction.' });
    }
};
