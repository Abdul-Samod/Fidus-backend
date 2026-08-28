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

        const { user, token } = await authService.loginUser(email, password);

        res.status(200).json({
            status: "success",
            message: "Login successful!",
            token,
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
