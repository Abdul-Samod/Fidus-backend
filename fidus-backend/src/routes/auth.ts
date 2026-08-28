import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";

const router = Router();



const JWT_SECRET = process.env.JWT_SECRET || "fidus_super_secret_key";

// SIGNUP ENDPOINT
router.post("/signup", async (req, res): Promise<any> => {
  try {
    const { fullName, email, role, password } = req.body;

    // Validation
    if (!fullName || !email || !role || !password) {
      return res
        .status(400)
        .json({ message: "All fields are strictly required." });
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { Email: email },
    });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Password Hashing
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Save to PostgreSQL
    const newUser = await prisma.users.create({
      data: {
        FullName: fullName,
        Email: email,
        Role: role,
        PasswordHash: passwordHash,
      },
    });

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
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error during signup.", error });
  }
});

// LOGIN ENDPOINT
router.post("/login", async (req, res): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    // Find user
    const user = await prisma.users.findUnique({ where: { Email: email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Generate JWT payload
    const token = jwt.sign({ uuid: user.uuid, role: user.Role }, JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(200).json({
      status: "success",
      message: "Login successful!",
      token,
      user: { uuid: user.uuid, fullName: user.FullName, role: user.Role },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error during login.", error });
  }
});

export default router;
