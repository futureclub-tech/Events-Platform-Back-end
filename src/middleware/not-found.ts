import type { RequestHandler } from 'express';
import { RESPONSE_MESSAGE } from '@/shared/constants/response-message.enum.js';
import { failureResponse } from '@/shared/types/api-response.js';

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json(failureResponse(RESPONSE_MESSAGE.ROUTE_NOT_FOUND));
};
