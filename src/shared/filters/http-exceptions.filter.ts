import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // throw the error resposne without modification if its from validation pipe
    if (
      typeof exceptionResponse === "object" &&
      exceptionResponse !== null &&
      "errors" in exceptionResponse
    ) {
      return response.status(status).json(exceptionResponse);
    }

    // Default fallback
    let code = "ERROR";
    let message = "An unexpected error occured";
    if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
      const resObj = exceptionResponse as {
        code: string;
        message: string;
        error: string;
      };
      code = resObj.code || code;
      message = resObj.message || resObj.error || message;
    } else if (typeof exceptionResponse === "string") {
      message = exceptionResponse;
    }
    response.status(status).json({
      success: false,
      code,
      message,
    });
  }
}
