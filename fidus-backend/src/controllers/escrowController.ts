import { type Request, type Response } from "express";
import * as escrowService from "../services/escrowService.js";

export const verifyTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reference, requestId, bidId } = req.body;

        const result = await escrowService.verifyTransaction(reference, requestId, bidId);

        res.status(200).json({
            status: 'success',
            message: 'Payment verified, funds locked in escrow, and job assigned!',
            data: result
        });

    } catch (error: any) {
        console.error("ESCROW VERIFICATION ERROR:", error.message);
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
