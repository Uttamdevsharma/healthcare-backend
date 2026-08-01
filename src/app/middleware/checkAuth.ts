import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import status from "http-status";
import { Role, UserStatus } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { prisma } from "../lib/prisma";
import { CookieUtils } from "../utils/cookie";
import { jwtUtils } from "../utils/jwt";

export const checkAuth = (...authRoles: Role[]) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        //Access Token Verification (primary auth)
        const accessToken = CookieUtils.getCookie(req, 'accessToken');

        if (!accessToken) {
            throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! No access token provided.');
        }

        const verifiedToken = jwtUtils.verifyToken(accessToken, envVars.ACCESS_TOKEN_SECRET);

        if (!verifiedToken.success || !verifiedToken.data) {
            throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! Invalid access token.');
        }

        const tokenData = verifiedToken.data as JwtPayload;

        req.user = {
            userId: tokenData.userId as string,
            role: tokenData.role as Role,
            email: tokenData.email as string,
        };

        if (authRoles.length > 0 && !authRoles.includes(req.user.role)) {
            throw new AppError(status.FORBIDDEN, 'Forbidden access! You do not have permission to access this resource.');
        }

        //Session Token Verification (optional, used for status checks + refresh headers)
        let userStatusChecked = false;

        const sessionToken = CookieUtils.getCookie(req, "better-auth.session_token");

        if (sessionToken) {
            const sessionExists = await prisma.session.findFirst({
                where: {
                    token: sessionToken,
                    expiresAt: {
                        gt: new Date(),
                    }
                },
                include: {
                    user: true,
                }
            })

            if (sessionExists && sessionExists.user) {
                const user = sessionExists.user;

                const now = new Date();
                const expiresAt = new Date(sessionExists.expiresAt)
                const createdAt = new Date(sessionExists.createdAt)

                const sessionLifeTime = expiresAt.getTime() - createdAt.getTime();
                const timeRemaining = expiresAt.getTime() - now.getTime();
                const percentRemaining = (timeRemaining / sessionLifeTime) * 100;

                if (percentRemaining < 20) {
                    res.setHeader('X-Session-Refresh', 'true');
                    res.setHeader('X-Session-Expires-At', expiresAt.toISOString());
                    res.setHeader('X-Time-Remaining', timeRemaining.toString());

                    console.log("Session Expiring Soon!!");
                }

                if (user.status === UserStatus.BLOCKED || user.status === UserStatus.DELETED) {
                    throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! User is not active.');
                }

                if (user.isDeleted) {
                    throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! User is deleted.');
                }

                userStatusChecked = true;
            }
        }

        //Fall back to a direct user lookup when there is no valid better-auth session
        //(e.g. right after registration, since sign-up doesn't create a session until the email is verified)
        if (!userStatusChecked) {
            const dbUser = await prisma.user.findUnique({
                where: {
                    id: req.user.userId,
                },
                select: {
                    status: true,
                    isDeleted: true,
                }
            })

            if (!dbUser) {
                throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! User not found.');
            }

            if (dbUser.status === UserStatus.BLOCKED || dbUser.status === UserStatus.DELETED) {
                throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! User is not active.');
            }

            if (dbUser.isDeleted) {
                throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! User is deleted.');
            }
        }

        next()
    } catch (error: any) {
        next(error);
    }
};