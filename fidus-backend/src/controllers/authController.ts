import { type Request, type Response } from "express";
import * as authService from "../services/authService.js";

export const signup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullName, email, role, password } = req.body;
        
        const newUser = await authService.signupUser(fullName, email, role, password);

        res.status(201).json({
            status: "success",
            message: "User registered successfully!",
            user: {
                uuid: newUser.uuid,
                fullName: newUser.FullName,
                email: newUser.Email,
                role: newUser.Role,
            },
        });
    } catch (error: any) {
        if (error.message === "EMAIL_EXISTS") {
            res.status(400).json({ message: "Email is already registered." });
            return;
        }
        res.status(500).json({ message: "Internal server error during signup.", error: error.message });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        const { user, accessToken, refreshToken } = await authService.loginUser(email, password);

        res.cookie('fidus_refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            status: "success",
            message: "Login successful!",
            token: accessToken,
            user: { uuid: user.uuid, fullName: user.FullName, role: user.Role },
        });
    } catch (error: any) {
        if (error.message === "INVALID_CREDENTIALS") {
            res.status(400).json({ message: "Invalid email or password." });
            return;
        }
        res.status(500).json({ message: "Internal server error during login.", error: error.message });
    }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.cookies.fidus_refresh_token;
        
        if (!token) {
            res.status(401).json({ status: 'error', message: 'No refresh token provided.' });
            return;
        }

        const newAccessToken = await authService.refreshAccessToken(token);

        res.status(200).json({
            status: 'success',
            token: newAccessToken
        });
    } catch (error: any) {
        // If refresh token is invalid or expired, clear the cookie
        res.clearCookie('fidus_refresh_token');
        res.status(401).json({ status: 'error', message: 'Refresh token expired or invalid.' });
    }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    res.clearCookie('fidus_refresh_token');
    res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
};
