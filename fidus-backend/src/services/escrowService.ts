import axios from 'axios';
import prisma from "../prisma.js";

export const verifyTransaction = async (reference: string, requestId: string, bidId: string) => {
    const paystackRes = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
    });

    const paystackData = paystackRes.data.data;

    if (paystackData.status !== 'success') {
        throw new Error('PAYMENT_FAILED');
    }

    const bid = await prisma.bids.findUnique({ where: { BidID: bidId } });
    if (!bid) {
        throw new Error('BID_NOT_FOUND');
    }

    const amountPaid = paystackData.amount / 100;
    if (Number(bid.ProposedPrice) !== amountPaid) {
        throw new Error('AMOUNT_MISMATCH');
    }

    const result = await prisma.$transaction([
        prisma.escrow_Transactions.create({
            data: {
                RequestID: requestId,
                AmountHeld: amountPaid,
                EscrowStatus: 'Funded'
            }
        }),
        prisma.service_Requests.update({
            where: { RequestID: requestId },
            data: { Status: 'Assigned' }
        }),
        prisma.bids.update({
            where: { BidID: bidId },
            data: { BidStatus: 'Accepted' }
        })
    ]);

    return result;
};
