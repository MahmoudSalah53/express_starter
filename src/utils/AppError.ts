export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperational = true;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}
