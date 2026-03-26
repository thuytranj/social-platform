import { Catch, ExceptionFilter } from "@nestjs/common";
import { ArgumentsHost, HttpStatus, HttpException } from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: String | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const { message: msg, error: err } = exceptionResponse as any;

        message = msg || exception.message;
        error = err || exception.message;
      }
      else {
        message = exceptionResponse as string;
        error = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.stack || exception.message;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}