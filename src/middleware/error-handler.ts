import type { ErrorRequestHandler } from "express";
import { RESPONSE_MESSAGE } from "@/shared/constants/response-message.enum.js";
import { failureResponse } from "@/shared/types/api-response.js";
import { AppError } from "@/shared/errors/app-error.js";

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof AppError) {
    response
      .status(error.statusCode)
      .json(
        failureResponse(
          error.messageCode,
          error.details as object | undefined,
        ),
      );
    return;
  }

  console.error("Unhandled request error", error);
  response.status(500).json(failureResponse(RESPONSE_MESSAGE.INTERNAL_ERROR));
};
