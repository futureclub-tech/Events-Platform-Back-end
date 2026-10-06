import express from "express";
import { RESPONSE_MESSAGE } from "@/shared/constants/response-message.enum.js";
import { errorHandler } from "@/shared/middleware/error-handler.js";
import { notFoundHandler } from "@/shared/middleware/not-found.js";
import { successResponse } from "@/shared/types/api-response.js";

export const app = express();

app.disable("x-powered-by");
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json(
    successResponse(RESPONSE_MESSAGE.HEALTH_CHECK_SUCCESS, { status: "ok" }),
  );
});

app.use(notFoundHandler);
app.use(errorHandler);
