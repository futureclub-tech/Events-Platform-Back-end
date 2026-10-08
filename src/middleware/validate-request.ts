import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { BadRequestError } from '@/shared/errors/app-error.js';
import { RESPONSE_MESSAGE } from '@/shared/constants/response-message.enum.js';

function formatValidationError(issue: z.ZodIssue): { field: string; code: string } {
  const path = issue.path[0] === 'body' ? issue.path.slice(1) : issue.path;
  const field = path.length > 0 ? path.join('.') : 'body';
  let code = 'INVALID_VALUE';

  if (issue.code === 'invalid_type' && issue.input === undefined) {
    code = 'REQUIRED';
  } else if (issue.code === 'invalid_format') {
    code = 'INVALID_FORMAT';
  } else if (issue.code === 'too_small') {
    code = 'TOO_SHORT';
  } else if (issue.code === 'too_big') {
    code = 'TOO_LONG';
  }

  return { field, code };
}

export function validateRequest(schema: z.ZodType): RequestHandler {
  return (request, _response, next) => {
    const result = schema.safeParse({
      body: request.body,
      query: request.query,
      params: request.params,
    });

    if (!result.success) {
      next(
        new BadRequestError(
          RESPONSE_MESSAGE.VALIDATION_FAILED,
          result.error.issues.map(formatValidationError),
        ),
      );
      return;
    }
    const validated = result.data as {
      body?: unknown;
      params?: Record<string, string>;
    };
    if (validated.body !== undefined) {
      request.body = validated.body;
    }
    if (validated.params !== undefined) {
      request.params = validated.params;
    }
    next();
  };
}
