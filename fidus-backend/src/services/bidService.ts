import prisma from "../prisma.js";

export const placeBid = async (artisanUuid: string, requestID: string, proposedPrice: number, message: string) => {
    const job = await prisma.service_Requests.findUnique({
        where: { RequestID: requestID }
    });

    if (!job) {
        throw new Error("JOB_NOT_FOUND");
    }

    if (job.Status !== 'Open') {
        throw new Error("JOB_NOT_OPEN");
    }

    const newBid = await prisma.bids.create({
        data: {
            RequestID: requestID,
            ArtisanID: artisanUuid,
            ProposedPrice: proposedPrice, 
            Message: message
        }
    });

    return newBid;
};

export const getBidsForJob = async (clientUuid: string, jobId: string) => {
    const job = await prisma.service_Requests.findUnique({
        where: { RequestID: jobId }
    });

    if (!job) {
        throw new Error("JOB_NOT_FOUND");
    }

    if (job.ClientID !== clientUuid) {
        throw new Error("UNAUTHORIZED_CLIENT");
    }

    const bids = await prisma.bids.findMany({
        where: { RequestID: jobId },
        include: {
            Artisan: {
                select: {
                    FullName: true,
                    WTA_Score: true,
                    KYC_Verified: true
                }
            }
        },
        orderBy: {
            Artisan: {
                WTA_Score: 'desc'
            }
        }
    });

    return bids;
};

export const makeBidDecision = async (clientUuid: string, bidId: string, decision: 'Accept' | 'Counter', counterAmount?: number) => {
    const bid = await prisma.bids.findUnique({
        where: { BidID: bidId },
        include: { Service: true } 
    });

    if (!bid) {
        throw new Error("BID_NOT_FOUND");
    }

    if (bid.Service.ClientID !== clientUuid) {
        throw new Error("UNAUTHORIZED_CLIENT");
    }

    if (bid.Service.Status !== 'Open') {
        throw new Error("JOB_NOT_OPEN");
    }

    if (decision === 'Accept') {
        const [updatedBid, updatedJob] = await prisma.$transaction([
            prisma.bids.update({
                where: { BidID: bidId },
                data: { BidStatus: 'Accepted' }
            }),
            prisma.service_Requests.update({
                where: { RequestID: bid.RequestID },
                data: { Status: 'Assigned' }
            })
        ]);
        return { type: 'Accept', updatedBid, updatedJob };
    }

    if (decision === 'Counter') {
        const updatedBid = await prisma.bids.update({
            where: { BidID: bidId },
            data: {
                BidStatus: 'Counter_Offered',
                CounterAmount: counterAmount ?? null
            }
        });
        return { type: 'Counter', updatedBid };
    }

    throw new Error("INVALID_DECISION");
};
