import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  logger.error({ err, url: req.url, method: req.method }, 'Unhandled API server error');
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Internal Server Error' : err.message || 'An error occurred',
  });
}
