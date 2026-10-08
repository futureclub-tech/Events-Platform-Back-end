import { RESPONSE_MESSAGE } from "../constants/response-message.enum.js";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly messageCode: RESPONSE_MESSAGE;
  public readonly details?: unknown;

  constructor(
    messageCode: RESPONSE_MESSAGE,
    statusCode: number = 400,
    details?: unknown,
  ) {
    super(messageCode);
    this.name = this.constructor.name;
    this.messageCode = messageCode;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(messageCode: RESPONSE_MESSAGE, details?: unknown) {
    super(messageCode, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    messageCode: RESPONSE_MESSAGE = RESPONSE_MESSAGE.UNAUTHORIZED,
    details?: unknown,
  ) {
    super(messageCode, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    messageCode: RESPONSE_MESSAGE = RESPONSE_MESSAGE.FORBIDDEN,
    details?: unknown,
  ) {
    super(messageCode, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(
    messageCode: RESPONSE_MESSAGE = RESPONSE_MESSAGE.USER_NOT_FOUND,
    details?: unknown,
  ) {
    super(messageCode, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(messageCode: RESPONSE_MESSAGE, details?: unknown) {
    super(messageCode, 409, details);
  }
}
