import { z } from 'zod';

export const verifyEscrowSchema = z.object({
    body: z.object({
        reference: z.string().min(1, "Reference is required"),
        requestId: z.string().uuid("Invalid Request ID format"),
        bidId: z.string().uuid("Invalid Bid ID format"),
    })
});
