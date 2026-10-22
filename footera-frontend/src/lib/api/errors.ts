export class AppApiError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
