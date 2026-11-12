import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Express 4 does not route async rejections to the error handler — wrap handlers.
export const asyncWrap =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let status = 500;
  let message = 'Internal server error';

  if (err instanceof HttpError) {
    status = err.status;
    message = err.message;
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (
    err instanceof mongoose.Error ||
    (err instanceof Error && /mongo|buffering timed out/i.test(err.message))
  ) {
    status = 503;
    message = 'Database unavailable — check MONGODB_URI / Atlas network access.';
  } else if (err instanceof SyntaxError) {
    status = 400;
    message = 'Malformed JSON body';
  } else if (err instanceof Error) {
    // Log server-side, never leak internals to the client
    console.error('[error]', err.message);
  }

  res.status(status).json({ error: message });
};
