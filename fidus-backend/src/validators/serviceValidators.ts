import { z } from 'zod';

export const createServiceRequestSchema = z.object({
    body: z.object({
        Description: z.string().min(10, "Description must be at least 10 characters long"),
        LocationCoordinates: z.string().min(1, "LocationCoordinates is required"),
        PriceRange: z.string().min(1, "PriceRange is required")
    })
});

export const completeServiceRequestSchema = z.object({
    params: z.object({
        jobId: z.string().uuid("Invalid Job ID format"),
    })
});
