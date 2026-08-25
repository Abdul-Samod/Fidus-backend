import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'; 
import { Pool } from 'pg'; 

// Setup DB connection for the service layer
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Calculates and updates the Fidus Weighted Trust Algorithm (WTA) score for a given artisan.
 * Returns the exact metrics used for the calculation.
 */
export const updateArtisanWTA = async (artisanID: string) => {
    // 1. Fetch the Artisan to ensure they exist
    const artisan = await prisma.users.findUnique({
        where: { uuid: artisanID }
    });

    if (!artisan) {
        throw new Error("Artisan not found.");
    }

    // 2. Fetch their KYC Submission Record to build the Baseline Trust Score (B)
    const kycRecord = await prisma.kycSubmission.findUnique({
        where: { userUuid: artisanID } 
    });

    let B = 100; // Base score after mandatory NIN verification

    if (kycRecord) {
        if (kycRecord.profilePicUrl && kycRecord.profilePicUrl !== "") {
            B += 10;
        }
        if (kycRecord.businessCert && kycRecord.businessCert !== "") {
            B += 20;
        }
    }

    // 3. Define WTA Constants
    const W1 = 0.6;  // Completion Weight
    const W2 = 4.0;  // Review Weight

    // 4. Calculate N (Total no. of Jobs) and C (Completion Rate)
    const artisanJobs = await prisma.service_Requests.findMany({
        where: { 
            Bids: { some: { ArtisanID: artisanID, BidStatus: 'Accepted' } } 
        }
    });

    const N = artisanJobs.length;
    const completedJobs = artisanJobs.filter(j => j.Status === 'Completed').length;
    const C = N > 0 ? (completedJobs / N) : 0;

    // 5. Calculate F (Client Feedback Average)
    const allReviews = await prisma.reviews.findMany({
        where: { ArtisanID: artisanID } 
    });
    
    const totalStars = allReviews.reduce((sum, rev) => sum + rev.Rating, 0);
    const F = allReviews.length > 0 ? (totalStars / allReviews.length) : 0;

    // 6. Execute the Dynamic WTA Formula
    const logDampener = Math.log10(N + 1);
    const rawWTA = B + (B * (W1 * C) + (W2 * F)) * logDampener;
    const finalWTAScore = parseFloat(rawWTA.toFixed(2));

    // 7. Save the new score to the database
    await prisma.users.update({
        where: { uuid: artisanID },
        data: { WTA_Score: finalWTAScore }
    });

    // Return the math breakdown so the controller can send it to the frontend
    return {
        DynamicBaseline_B: B,
        TotalJobs_N: N,
        CompletionRate_C: C,
        AverageRating_F: F,
        New_WTA_Score: finalWTAScore
    };
};