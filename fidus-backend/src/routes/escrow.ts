import express, { type Request, type Response } from 'express';
import axios from 'axios';
import prisma from "../prisma.js";
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();


router.post('/verify', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const { reference, requestId, bidId } = req.body;

        // 1. Ping Paystack to verify the transaction actually happened
        const paystackRes = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
        });

        const paystackData = paystackRes.data.data;

        // 2. Reject if the payment wasn't completely successful
        if (paystackData.status !== 'success') {
            res.status(400).json({ status: 'error', message: 'Payment verification failed.' });
            return;
        }

        // 3. The Atomic State Machine Update
        // Paystack returns amount in kobo, so we divide by 100 to get Naira
        const amountPaid = paystackData.amount / 100;

        const result = await prisma.$transaction([
            // Lock the funds in Escrow
            prisma.escrow_Transactions.create({
                data: {
                    RequestID: String(requestId),
                    AmountHeld: amountPaid,
                    EscrowStatus: 'Pending'
                }
            }),
            // Upgrade the Job Status
            prisma.service_Requests.update({
                where: { RequestID: String(requestId) },
                data: { Status: 'Assigned' }
            }),
            // Mark the winning Bid as Accepted
            prisma.bids.update({
                where: { BidID: String(bidId) },
                data: { BidStatus: 'Accepted' }
            })
        ]);

        res.status(200).json({
            status: 'success',
            message: 'Payment verified, funds locked in escrow, and job assigned!',
            data: result
        });

    } catch (error: any) {
        console.error("ESCROW VERIFICATION ERROR:", error.message);
        res.status(500).json({ status: 'error', message: 'Failed to verify transaction.' });
    }
});

export default router;