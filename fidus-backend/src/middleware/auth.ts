import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface FidusJwtPayload extends jwt.JwtPayload {
  uuid: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: FidusJwtPayload;
}

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  // Get the authorization header from the incoming request
  const authHeader = req.headers.authorization;

  // Check if the header exists AND starts with 'Bearer '
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      status: "error",
      message: "Access Denied: No token provided",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  // Check if token exists
  if (!token) {
    res.status(401).json({
      status: "error",
      message: "Access Denied: No token provided",
    });
    return;
  }

  // Debugging
  console.log("Token received:", token);
  console.log("Secret key:", process.env.JWT_SECRET ? "YES" : "NO");

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    // Attach decoded payload(UUID and role) to the request object
    req.user = decoded as FidusJwtPayload;

    // Grant user access to thye route
    next();
  } catch (error: any) {
    console.log("JWT VERIFY ERROR:", error.message);
    // Respond with an error if token is invalid or expired
    res.status(403).json({
      status: "error",
      message: "Access Denied: Invalid or expired token.",
    });
    return;
  }
};
