import { z } from 'zod';

export const createServiceRequestSchema = z.object({
    body: z.object({
        Title: z.string().min(5, "Title must be at least 5 characters long").max(100, "Title must be at most 100 characters"),
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
