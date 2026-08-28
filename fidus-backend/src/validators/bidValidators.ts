import { z } from 'zod';

export const createBidSchema = z.object({
    body: z.object({
        requestID: z.string().uuid("Invalid Request ID format"),
        proposedPrice: z.number().positive("Proposed price must be positive"),
        message: z.string().min(1, "Message is required"),
    })
});

export const getBidsSchema = z.object({
    params: z.object({
        jobId: z.string().uuid("Invalid Job ID format"),
    })
});

export const bidDecisionSchema = z.object({
    body: z.object({
        bidId: z.string().uuid("Invalid Bid ID format"),
        decision: z.enum(['Accept', 'Counter']),
        counterAmount: z.number().positive("Counter amount must be positive").optional(),
    }).refine((data) => {
        if (data.decision === 'Counter' && data.counterAmount === undefined) {
            return false;
        }
        return true;
    }, {
        message: "You must provide a counterAmount to haggle",
        path: ["counterAmount"]
    })
});
