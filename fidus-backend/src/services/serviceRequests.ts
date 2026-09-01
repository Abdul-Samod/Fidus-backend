import prisma from "../prisma.js";
import { updateArtisanWTA } from "./wtaService.js";

export const createServiceRequest = async (clientUuid: string, title: string, description: string, locationCoordinates: string, priceRange: string) => {
    return await prisma.service_Requests.create({
        data: {
            ClientID: clientUuid,
            Title: title,
            Description: description,
            LocationCoordinates: locationCoordinates,
            PriceRange: priceRange,
            Status: 'Open'
        }
    });
};

export const getOpenServiceRequests = async (artisanUuid: string) => {
    return await prisma.service_Requests.findMany({
        where: {
            OR: [
                { Status: 'Open' },
                { Bids: { some: { ArtisanID: artisanUuid } } }
            ]
        },
        include: {
            Bids: {
                where: { ArtisanID: artisanUuid }
            },
            Escrow_Transaction: true,
            Reviews: true
        },
        orderBy: { CreatedAt: 'desc' }
    });
};

export const getMyServiceRequests = async (clientUuid: string) => {
    return await prisma.service_Requests.findMany({
        where: { ClientID: clientUuid },
        include: {
            Escrow_Transaction: true,
            Reviews: true
        },
        orderBy: { CreatedAt: 'desc' }
    });
};

export const handleServiceCompletionHandshake = async (jobId: string, userUuid: string, userRole: string) => {
    const job = await prisma.service_Requests.findUnique({
        where: { RequestID: jobId },
        include: { Bids: { where: { BidStatus: 'Accepted' } } }
    });

    if (!job) {
        throw new Error('NOT_FOUND');
    }
    if (job.Status !== 'Assigned') {
        throw new Error('INVALID_STATUS');
    }

    const acceptedBid = job.Bids[0];
    if (!acceptedBid) {
        throw new Error('NO_ACCEPTED_BID');
    }

    let updateData: any = {};
    if (userRole === 'Client') {
        if (job.ClientID !== userUuid) throw new Error('UNAUTHORIZED_CLIENT');
        updateData = { ClientCompleted: true };
    } else if (userRole === 'Artisan') {
        if (acceptedBid.ArtisanID !== userUuid) throw new Error('UNAUTHORIZED_ARTISAN');
        updateData = { ArtisanCompleted: true };
    } else {
        throw new Error('INVALID_ROLE');
    }

    const updatedJob = await prisma.service_Requests.update({
        where: { RequestID: jobId },
        data: updateData
    });

    if (updatedJob.ClientCompleted && updatedJob.ArtisanCompleted) {
        const [finalizedJob, releasedEscrow] = await prisma.$transaction([
            prisma.service_Requests.update({
                where: { RequestID: jobId },
                data: { Status: 'Completed' }
            }),
            prisma.escrow_Transactions.update({
                where: { RequestID: jobId },
                data: { EscrowStatus: 'Released' }
            })
        ]);

        const wtaMetrics = await updateArtisanWTA(acceptedBid.ArtisanID);
        return { complete: true, finalizedJob, releasedEscrow, wtaMetrics };
    }

    return { complete: false, updatedJob };
};
