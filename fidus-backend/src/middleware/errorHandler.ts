import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl || req.url}:`, err);

  // Handle known Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = (err.meta?.target as string[])?.join(', ') || 'field';
        res.status(409).json({
          status: 'error',
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: `A record with this ${target} already exists.`
        });
        return;
      }
      case 'P2025':
        res.status(404).json({
          status: 'error',
          code: 'NOT_FOUND',
          message: 'The requested record was not found.'
        });
        return;
      case 'P2003':
        res.status(400).json({
          status: 'error',
          code: 'FOREIGN_KEY_VIOLATION',
          message: 'Referenced related record does not exist.'
        });
        return;
      default:
        res.status(400).json({
          status: 'error',
          code: err.code,
          message: err.message || 'Database request error.'
        });
        return;
    }
  }

  // Handle Prisma validation errors (e.g. wrong type passed)
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Invalid data format provided for database operation.'
    });
    return;
  }

  // Handle Prisma initialization / connection errors (e.g. paused DB or network issue)
  if (err instanceof Prisma.PrismaClientInitializationError) {
    res.status(503).json({
      status: 'error',
      code: 'DATABASE_UNAVAILABLE',
      message: 'Database service is temporarily unavailable. Please retry in a moment.'
    });
    return;
  }

  const status = err.status || 500;
  const message = err.status ? err.message : 'Internal Server Error';

  res.status(status).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.message 
    }),
  });
};
