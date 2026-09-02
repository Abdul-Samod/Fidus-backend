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

export const getOpenServiceRequests = async (artisanUuid: string, page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;
    
    const whereCondition = {
        OR: [
            { Status: 'Open' as any },
            { Bids: { some: { ArtisanID: artisanUuid } } }
        ]
    };

    const [total, data] = await Promise.all([
        prisma.service_Requests.count({ where: whereCondition }),
        prisma.service_Requests.findMany({
            where: whereCondition,
            include: {
                Bids: { where: { ArtisanID: artisanUuid } },
                Escrow_Transaction: true,
                Reviews: true
            },
            orderBy: { CreatedAt: 'desc' },
            skip,
            take: limit
        })
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getMyServiceRequests = async (clientUuid: string, page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;
    const whereCondition = { ClientID: clientUuid };

    const [total, data] = await Promise.all([
        prisma.service_Requests.count({ where: whereCondition }),
        prisma.service_Requests.findMany({
            where: whereCondition,
            include: {
                Escrow_Transaction: true,
                Reviews: true
            },
            orderBy: { CreatedAt: 'desc' },
            skip,
            take: limit
        })
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
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
