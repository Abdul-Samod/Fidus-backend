import prisma from "../prisma.js";

export const uploadNIN = async (artisanUuid: string, secureUrl: string) => {
    const kycRecord = await prisma.kycSubmission.upsert({
        where: { userUuid: artisanUuid },
        update: { ninUrl: secureUrl },
        create: { userUuid: artisanUuid, ninUrl: secureUrl }
    });

    await prisma.users.update({
        where: { uuid: artisanUuid },
        data: {
            KYC_Verified: true,
            WTA_Score: 100.0
        }
    });

    return kycRecord;
};

export const uploadProfilePic = async (artisanUuid: string, secureUrl: string) => {
    const kycRecord = await prisma.kycSubmission.upsert({
        where: { userUuid: artisanUuid },
        update: { profilePicUrl: secureUrl },
        create: { userUuid: artisanUuid, profilePicUrl: secureUrl }
    });

    await prisma.users.update({
        where: { uuid: artisanUuid },
        data: { WTA_Score: { increment: 10.0 } }
    });

    return kycRecord;
};

export const uploadBusinessCert = async (artisanUuid: string, secureUrl: string) => {
    const kycRecord = await prisma.kycSubmission.upsert({
        where: { userUuid: artisanUuid },
        update: { businessCert: secureUrl },
        create: { userUuid: artisanUuid, businessCert: secureUrl }
    });

    await prisma.users.update({
        where: { uuid: artisanUuid },
        data: { WTA_Score: { increment: 20.0 } }
    });

    return kycRecord;
};

export const getKycStatus = async (artisanUuid: string) => {
    return await prisma.users.findUnique({
        where: { uuid: artisanUuid },
        select: {
            uuid: true,
            FullName: true,
            KYC_Verified: true,
            WTA_Score: true,
            kycDetails: true
        }
    });
};
