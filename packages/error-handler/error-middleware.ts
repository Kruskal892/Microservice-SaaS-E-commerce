import type { NextFunction, Request, Response } from 'express';
import { AppError } from './index';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (res.headersSent) return next(err);
  if ('status' in err && (err.status === 400 || err.status === 413)) {
    return res.status(err.status).json({
      status: 'error',
      message:
        err.status === 413 ? 'Request body too large' : 'Invalid request body',
    });
  }
  if (err instanceof AppError) {
    console.log(`Error ${req.method} ${req.url} - ${err.message}`);

    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  console.log('Unhandle error', err);

  return res.status(500).json({
    error: 'Something went wrong please try again',
  });
};
