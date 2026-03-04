import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

interface ErrorResponseBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(HttpExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<{ method?: string; originalUrl?: string; url?: string }>();
    const response = context.getResponse<Response>();
    const requestMethod = request.method ?? 'HTTP';
    const requestPath = request.originalUrl ?? request.url ?? 'unknown-path';

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const normalizedResponse = this.normalizeHttpExceptionResponse(
        exceptionResponse,
        exception,
        statusCode,
      );

      this.logger.warn(
        {
          type: 'http',
          method: requestMethod,
          path: requestPath,
          statusCode,
          error: normalizedResponse.error,
          message: normalizedResponse.message,
        },
        'Handled HTTP exception',
      );

      response.status(statusCode).json({
        statusCode,
        message: normalizedResponse.message,
        error: normalizedResponse.error,
        timestamp: new Date().toISOString(),
      });

      return;
    }

    const error = exception instanceof Error ? exception : new Error('Unknown exception');
    this.logger.error(
      {
        type: 'http',
        method: requestMethod,
        path: requestPath,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        err: error,
      },
      'Unhandled HTTP exception',
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
      timestamp: new Date().toISOString(),
    });
  }

  private normalizeHttpExceptionResponse(
    exceptionResponse: string | object,
    exception: HttpException,
    fallbackStatusCode: number,
  ): Required<ErrorResponseBody> {
    if (typeof exceptionResponse === 'string') {
      return {
        statusCode: fallbackStatusCode,
        message: exceptionResponse,
        error: this.getExceptionName(exception),
      };
    }

    const responseBody = exceptionResponse as ErrorResponseBody;

    return {
      statusCode: responseBody.statusCode ?? fallbackStatusCode,
      message: responseBody.message ?? this.getDefaultErrorLabel(fallbackStatusCode),
      error: responseBody.error ?? this.getDefaultErrorLabel(fallbackStatusCode),
    };
  }

  private getDefaultErrorLabel(statusCode: number): string {
    const statusLabel = HttpStatus[statusCode];
    if (!statusLabel) {
      return 'Error';
    }

    return statusLabel
      .toLowerCase()
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  private getExceptionName(exception: HttpException): string {
    return exception.name.replace(/Exception$/, '').trim() || 'Error';
  }
}
