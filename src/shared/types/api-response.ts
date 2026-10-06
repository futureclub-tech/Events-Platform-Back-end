import type { RESPONSE_MESSAGE } from "../constants/response-message.enum.js";

export interface ApiResponse<TData = undefined> {
  success: boolean;
  message: RESPONSE_MESSAGE;
  data?: TData;
  errors?: object;
}

export function successResponse<TData>(
  message: RESPONSE_MESSAGE,
  data: TData,
): ApiResponse<TData> {
  return { success: true, message, data };
}

export function failureResponse(
  message: RESPONSE_MESSAGE,
  errors?: Object,
): ApiResponse<never> {
  return errors === undefined
    ? { success: false, message }
    : { success: false, message, errors };
}
