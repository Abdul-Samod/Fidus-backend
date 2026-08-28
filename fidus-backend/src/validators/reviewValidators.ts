import { z } from 'zod';

export const createReviewSchema = z.object({
    body: z.object({
        requestID: z.string().uuid("Invalid Request ID format"),
        artisanID: z.string().uuid("Invalid Artisan ID format"),
        rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
        comment: z.string().optional(),
    })
});
