import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
}

export const signupUser = async (fullName: string, email: string, role: any, password: string) => {
    const existingUser = await prisma.users.findUnique({
        where: { Email: email },
    });
    
    if (existingUser) {
        throw new Error("EMAIL_EXISTS");
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.users.create({
        data: {
            FullName: fullName,
            Email: email,
            Role: role,
            PasswordHash: passwordHash,
        },
    });

    return newUser;
};

export const loginUser = async (email: string, password: string) => {
    const user = await prisma.users.findUnique({ where: { Email: email } });
    if (!user) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);
    if (!isPasswordValid) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const accessToken = jwt.sign({ uuid: user.uuid, role: user.Role }, JWT_SECRET, {
        expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ uuid: user.uuid, role: user.Role }, JWT_SECRET, {
        expiresIn: "7d",
    });

    return { user, accessToken, refreshToken };
};

export const refreshAccessToken = async (token: string) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { uuid: string, role: string };
        
        // Issue new access token
        const newAccessToken = jwt.sign({ uuid: decoded.uuid, role: decoded.role }, JWT_SECRET, {
            expiresIn: "15m",
        });

        return newAccessToken;
    } catch (error) {
        throw new Error('INVALID_REFRESH_TOKEN');
    }
};
