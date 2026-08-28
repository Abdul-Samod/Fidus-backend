import prisma from "../prisma.js";
import { updateArtisanWTA } from "../services/wtaService.js";

export const createReview = async (clientUuid: string, requestID: string, artisanID: string, rating: number, comment?: string) => {
    const job = await prisma.service_Requests.findUnique({
        where: { RequestID: requestID }
    });

    if (!job) {
        throw new Error('JOB_NOT_FOUND');
    }

    if (job.ClientID !== clientUuid) {
        throw new Error('UNAUTHORIZED_CLIENT');
    }

    if (job.Status !== 'Completed') {
        throw new Error('JOB_NOT_COMPLETED');
    }

    const newReview = await prisma.reviews.create({
        data: {
            RequestID: requestID,
            ClientID: clientUuid,
            ArtisanID: artisanID,
            Rating: rating,
            Comment: comment || ""
        }
    });

    const wtaMetrics = await updateArtisanWTA(artisanID);

    return { review: newReview, wta_metrics: wtaMetrics };
};
