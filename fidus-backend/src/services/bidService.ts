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

    const artisan = await prisma.users.findUnique({
        where: { uuid: artisanUuid }
    });

    if (!artisan || !artisan.KYC_Verified) {
        throw new Error("UNVERIFIED_ARTISAN");
    }

    const existingBid = await prisma.bids.findFirst({
        where: { RequestID: requestID, ArtisanID: artisanUuid }
    });

    if (existingBid) {
        throw new Error("ALREADY_BID");
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

export const getBidsForJob = async (clientUuid: string, jobId: string, page: number = 1, limit: number = 10) => {
    const job = await prisma.service_Requests.findUnique({
        where: { RequestID: jobId }
    });

    if (!job) {
        throw new Error("JOB_NOT_FOUND");
    }

    if (job.ClientID !== clientUuid) {
        throw new Error("UNAUTHORIZED_CLIENT");
    }

    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
        prisma.bids.count({ where: { RequestID: jobId } }),
        prisma.bids.findMany({
            where: { RequestID: jobId },
            skip,
            take: limit,
            include: {
                Artisan: {
                select: {
                    FullName: true,
                    WTA_Score: true,
                    KYC_Verified: true,
                    kycDetails: {
                        select: {
                            profilePicUrl: true
                        }
                    }
                }
            }
        },
        orderBy: {
            Artisan: {
                WTA_Score: 'desc'
            }
        }
        })
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const makeBidDecision = async (clientUuid: string, bidId: string, decision: 'Accept' | 'Counter' | 'Reject', counterAmount?: number) => {
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

    if (decision === 'Reject') {
        const updatedBid = await prisma.bids.update({
            where: { BidID: bidId },
            data: {
                BidStatus: 'Rejected'
            }
        });
        return { type: 'Reject', updatedBid };
    }

    throw new Error("INVALID_DECISION");
};

export const artisanAcceptCounter = async (artisanUuid: string, bidId: string) => {
    const bid = await prisma.bids.findUnique({
        where: { BidID: bidId },
        include: { Service: true }
    });

    if (!bid) {
        throw new Error("BID_NOT_FOUND");
    }

    if (bid.ArtisanID !== artisanUuid) {
        throw new Error("UNAUTHORIZED_ARTISAN");
    }

    if (bid.BidStatus !== 'Counter_Offered') {
        throw new Error("INVALID_STATUS");
    }

    const [updatedBid, updatedJob] = await prisma.$transaction([
        prisma.bids.update({
            where: { BidID: bidId },
            data: {
                BidStatus: 'Accepted',
                ProposedPrice: bid.CounterAmount!,
                CounterAmount: null
            }
        }),
        prisma.service_Requests.update({
            where: { RequestID: bid.RequestID },
            data: { Status: 'Assigned' }
        })
    ]);

    return { updatedBid, updatedJob };
};
