import { Injectable } from '@nestjs/common';
import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { IResponse } from '../interfaces/response.interface';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  IResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IResponse<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(map((data) => ({
      success: true,
      statusCode: response.statusCode || 200,
      message: 'Success',
      data,
      timestamp: new Date().toISOString(),
      path: request.url,
    })));
  }
}
