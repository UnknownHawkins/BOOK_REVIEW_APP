import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from "@bookhub/shared";
import { prisma } from "../config/db";
import { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } from "../utils/errors";
import { logger } from "../config/logger";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key_for_bookhub_auth_system_12345";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret_key_for_bookhub_auth_system_67890";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "15m";
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";

// Lockout configuration
const LOCKOUT_LIMIT = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
const failedLoginAttempts = new Map<string, { count: number; lockUntil: number }>();

const setCookies = (res: Response, token: string, refreshToken: string) => {
  const isProd = process.env.NODE_ENV === "production";
  
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = await RegisterSchema.parseAsync(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictError("Email address is already registered");
      }
      throw new ConflictError("Username is already taken");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role: "user",
        avatar: username.charAt(0).toUpperCase()
      }
    });

    // Generate tokens
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY as any });
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY as any });

    // Save refresh token session in database
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Write Activity Log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "USER_REGISTER",
        details: `User registered with username: ${username}`
      }
    });

    setCookies(res, token, refreshToken);

    res.status(201).json({
      status: "success",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = await LoginSchema.parseAsync(req.body);

    const ip = req.ip || "unknown";
    const failedInfo = failedLoginAttempts.get(ip);
    const now = Date.now();

    // Check lockout
    if (failedInfo && failedInfo.count >= LOCKOUT_LIMIT && failedInfo.lockUntil > now) {
      const remainingTime = Math.ceil((failedInfo.lockUntil - now) / 1000 / 60);
      throw new BadRequestError(`Too many failed login attempts. Please try again in ${remainingTime} minute(s).`);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Record failed attempt
      const attempts = (failedInfo ? failedInfo.count : 0) + 1;
      const lockUntil = attempts >= LOCKOUT_LIMIT ? now + LOCKOUT_TIME : 0;
      failedLoginAttempts.set(ip, { count: attempts, lockUntil });

      throw new UnauthorizedError("Invalid email or password");
    }

    // Verify password
    if (!user.passwordHash) {
      throw new UnauthorizedError("Invalid email or password");
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      // Record failed attempt
      const attempts = (failedInfo ? failedInfo.count : 0) + 1;
      const lockUntil = attempts >= LOCKOUT_LIMIT ? now + LOCKOUT_TIME : 0;
      failedLoginAttempts.set(ip, { count: attempts, lockUntil });

      throw new UnauthorizedError("Invalid email or password");
    }

    // Success: Reset lockout for this IP
    failedLoginAttempts.delete(ip);

    // Generate tokens
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY as any });
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY as any });

    // Save refresh token session in database
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Write Activity Log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "USER_LOGIN",
        details: "User logged in successfully"
      }
    });

    setCookies(res, token, refreshToken);

    res.status(200).json({
      status: "success",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Delete session from DB
      await prisma.session.deleteMany({
        where: { token: refreshToken }
      });
    }

    // Clear cookies
    res.clearCookie("token");
    res.clearCookie("refreshToken");

    res.status(200).json({
      status: "success",
      message: "Logged out successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token is required");
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    // Check session in database
    const session = await prisma.session.findUnique({
      where: { token: refreshToken }
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      throw new UnauthorizedError("Session has expired. Please log in again.");
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, role: true, email: true, avatar: true }
    });

    if (!user) {
      throw new UnauthorizedError("User no longer exists");
    }

    // Generate new tokens
    const newToken = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY as any });
    const newRefreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY as any });

    // Rotate refresh token: delete old, create new
    await prisma.session.delete({ where: { id: session.id } });
    await prisma.session.create({
      data: {
        userId: user.id,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    setCookies(res, newToken, newRefreshToken);

    res.status(200).json({
      status: "success",
      token: newToken,
      user
    });
  } catch (error) {
    next(error);
  }
};

// Forgot and Reset Password Placeholders/Helpers
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = await ForgotPasswordSchema.parseAsync(req.body);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new NotFoundError("No user registered with this email address");
    }

    // Generate a reset token (using a temporary JWT)
    const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1h" });

    // In a real application, you would send an email here.
    // For this prototype, we'll return the reset token directly to simulate the flow.
    res.status(200).json({
      status: "success",
      message: "Password reset link sent to your email",
      resetToken // Return for demo purposes
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = await ResetPasswordSchema.parseAsync(req.body);

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      throw new BadRequestError("Invalid or expired password reset token");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Update user password and clear any sessions
    await prisma.$transaction([
      prisma.user.update({
        where: { id: decoded.id },
        data: { passwordHash }
      }),
      prisma.session.deleteMany({
        where: { userId: decoded.id }
      })
    ]);

    res.status(200).json({
      status: "success",
      message: "Password has been reset successfully. You can now log in with your new password."
    });
  } catch (error) {
    next(error);
  }
};
