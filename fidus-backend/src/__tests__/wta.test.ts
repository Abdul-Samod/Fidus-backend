import { describe, it, expect } from 'vitest';
import { calculateWTAScore } from '../services/wtaService.js';

describe('Weighted Trust Algorithm (WTA) Unit Tests', () => {
    
    it('should calculate the correct base score for an artisan with 0 jobs', () => {
        // Base score = 100, 0 jobs, 0 completion, 0 reviews
        // log10(0 + 1) = 0. Therefore, the multiplier is 0.
        // Result should be exactly 100.
        const score = calculateWTAScore(100, 0, 0, 0);
        expect(score).toBe(100);
    });

    it('should calculate the correct score for an artisan with perfect completion and 5-star reviews', () => {
        // B = 130 (Fully verified)
        // C = 1.0 (100% completion)
        // F = 5.0 (5-star reviews)
        // N = 9 (9 jobs done)
        // log10(9 + 1) = log10(10) = 1
        // W1 = 0.6, W2 = 4.0
        // rawWTA = 130 + (130 * (0.6 * 1.0) + (4.0 * 5.0)) * 1
        // rawWTA = 130 + (78 + 20) * 1 = 130 + 98 = 228
        const score = calculateWTAScore(130, 1.0, 5.0, 9);
        expect(score).toBe(228);
    });

    it('should calculate a lower score for an artisan with poor completion rate', () => {
        // B = 100
        // C = 0.5 (50% completion)
        // F = 3.0 (3-star average)
        // N = 99 (99 jobs done)
        // log10(99 + 1) = log10(100) = 2
        // rawWTA = 100 + (100 * (0.6 * 0.5) + (4.0 * 3.0)) * 2
        // rawWTA = 100 + (30 + 12) * 2 = 100 + 84 = 184
        const score = calculateWTAScore(100, 0.5, 3.0, 99);
        expect(score).toBe(184);
    });

});
