import { prisma } from '../libs';
import { NextFunction, Response } from 'express';
import jwt, { JsonWebTokenError } from 'jsonwebtoken';
export const isAuthenticated = async (
  req: any,
  res: Response,
  next: NextFunction,
) => {
  try {
    const accessToken =
      req.cookies?.access_token || req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: Access token is missing' });
    }

    const accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
    if (!accessTokenSecret) {
      throw new Error('JWT access token secret is not configured');
    }

    const decoded = jwt.verify(accessToken, accessTokenSecret) as {
      id: string;
      role: 'user' | 'admin';
    };

    if (!decoded || !decoded.id || !decoded.role) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: Invalid access token' });
    }

    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
    });

    req.user = user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }
    return next();
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      return res
        .status(401)
        .json({ message: 'Unauthorized: Invalid access token' });
    }
    return next(error);
  }
};
