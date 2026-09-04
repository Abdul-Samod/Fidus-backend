import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRoutes from '../routes/auth.js';
import * as authService from '../services/authService.js';

// Setup isolated express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// Mock the auth service to prevent database writes during testing
vi.mock('../services/authService.js', () => ({
    signupUser: vi.fn(),
    loginUser: vi.fn(),
    refreshAccessToken: vi.fn()
}));

describe('Auth Integration Tests (Controllers & Routes)', () => {
    
    it('should successfully register a new user and return 201', async () => {
        // Mock the service return value
        vi.mocked(authService.signupUser).mockResolvedValue({
            uuid: 'test-uuid-123',
            FullName: 'Test Artisan',
            Email: 'test@fidus.com',
            Role: 'Artisan',
            PasswordHash: 'hashedpassword',
            KYC_Verified: false,
            WTA_Score: 0
        });

        const res = await request(app)
            .post('/api/auth/signup')
            .send({
                fullName: 'Test Artisan',
                email: 'test@fidus.com',
                password: 'securePassword123',
                role: 'Artisan'
            });

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('success');
        expect(res.body.user.email).toBe('test@fidus.com');
    });

    it('should successfully login a user and return a token with HttpOnly cookie', async () => {
        // Mock the service return value
        vi.mocked(authService.loginUser).mockResolvedValue({
            user: {
                uuid: 'test-uuid-123',
                FullName: 'Test Artisan',
                Email: 'test@fidus.com',
                Role: 'Artisan',
                PasswordHash: 'hashedpassword',
                KYC_Verified: false,
                WTA_Score: 0
            },
            accessToken: 'mocked-jwt-token',
            refreshToken: 'mocked-refresh-token'
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@fidus.com',
                password: 'securePassword123'
            });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('success');
        expect(res.body.token).toBe('mocked-jwt-token');

        // Check if the cookie was set correctly
        const cookies = res.headers['set-cookie'];
        expect(cookies).toBeDefined();
        expect(cookies[0]).toContain('fidus_refresh_token=mocked-refresh-token');
        expect(cookies[0]).toContain('HttpOnly');
    });

});
