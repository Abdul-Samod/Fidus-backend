import { z } from 'zod';

export const signupSchema = z.object({
    body: z.object({
        fullName: z.string().min(1, "Full name is required"),
        email: z.string().email("Invalid email format"),
        role: z.enum(['Client', 'Artisan']),
        password: z.string().min(6, "Password must be at least 6 characters long"),
    })
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(1, "Password is required"),
    })
});
