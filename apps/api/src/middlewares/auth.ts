import { Request, Response, NextFunction } from "express";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import { prisma } from "../config/db";
import { clerkClient } from "@clerk/clerk-sdk-node";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = "";

    // 1. Check cookies
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } 
    // 2. Check authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new UnauthorizedError("Authentication token is required");
    }

    // Verify token with Clerk
    let decoded;
    try {
      decoded = await clerkClient.verifyToken(token);
    } catch (err) {
      throw new UnauthorizedError("Invalid or expired Clerk token");
    }

    // Check if user exists in local database by clerkId
    let localUser = await prisma.user.findUnique({
      where: { clerkId: decoded.sub },
      select: { id: true, username: true, role: true },
    });

    if (!localUser) {
      const clerkUser = await clerkClient.users.getUser(decoded.sub);
      const email = clerkUser.emailAddresses[0]?.emailAddress;

      if (!email) {
        throw new UnauthorizedError("Clerk user has no email address associated");
      }

      // Check if user already exists by email
      localUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, username: true, role: true },
      });

      if (localUser) {
        // Link Clerk identity to existing account
        localUser = await prisma.user.update({
          where: { id: localUser.id },
          data: { clerkId: decoded.sub },
          select: { id: true, username: true, role: true },
        });
      } else {
        // Create new user record
        const username = clerkUser.username || email.split("@")[0] || "user_" + Math.random().toString(36).substring(7);
        localUser = await prisma.user.create({
          data: {
            clerkId: decoded.sub,
            email,
            username,
            role: "user",
            avatar: clerkUser.imageUrl || null,
          },
          select: { id: true, username: true, role: true },
        });
      }
    }

    req.user = localUser;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new UnauthorizedError("Authentication is required"));
  }

  if (req.user.role !== "admin") {
    return next(new ForbiddenError("Access restricted to administrators only"));
  }

  next();
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = "";

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      const decoded = await clerkClient.verifyToken(token);
      let localUser = await prisma.user.findUnique({
        where: { clerkId: decoded.sub },
        select: { id: true, username: true, role: true },
      });

      if (!localUser) {
        const clerkUser = await clerkClient.users.getUser(decoded.sub);
        const email = clerkUser.emailAddresses[0]?.emailAddress;
        if (email) {
          localUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true, username: true, role: true },
          });

          if (localUser) {
            localUser = await prisma.user.update({
              where: { id: localUser.id },
              data: { clerkId: decoded.sub },
              select: { id: true, username: true, role: true },
            });
          } else {
            const username = clerkUser.username || email.split("@")[0] || "user_" + Math.random().toString(36).substring(7);
            localUser = await prisma.user.create({
              data: {
                clerkId: decoded.sub,
                email,
                username,
                role: "user",
                avatar: clerkUser.imageUrl || null,
              },
              select: { id: true, username: true, role: true },
            });
          }
        }
      }

      if (localUser) {
        req.user = localUser;
      }
    }
    next();
  } catch (error) {
    next();
  }
};
