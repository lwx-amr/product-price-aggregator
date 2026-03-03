import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { createHttpArgumentsHost } from '@test/helpers/arguments-host.helper';
import type { PinoLogger } from 'nestjs-pino';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let logger: Pick<PinoLogger, 'warn' | 'error'>;
  let response: {
    status: jest.Mock;
    json: jest.Mock;
  };

  beforeAll(() => {
    logger = {
      warn: jest.fn(),
      error: jest.fn(),
    };

    filter = new HttpExceptionFilter(logger as PinoLogger);
  });

  beforeEach(() => {
    (logger.warn as jest.Mock).mockReset();
    (logger.error as jest.Mock).mockReset();
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('formats HttpException responses with message arrays intact', () => {
    const exception = new BadRequestException({
      message: ['name must not be empty', 'price must be a number'],
      error: 'Bad Request',
      statusCode: HttpStatus.BAD_REQUEST,
    });

    filter.catch(exception, createHttpArgumentsHost(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ['name must not be empty', 'price must be a number'],
        error: 'Bad Request',
        timestamp: expect.any(String),
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'http',
        method: 'HTTP',
        path: 'unknown-path',
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: ['name must not be empty', 'price must be a number'],
      }),
      'Handled HTTP exception',
    );
  });

  it('uses a generic internal error response for unknown exceptions', () => {
    const exception = new Error('database unavailable');

    filter.catch(exception, createHttpArgumentsHost(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: 'Internal Server Error',
        timestamp: expect.any(String),
      }),
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'http',
        method: 'HTTP',
        path: 'unknown-path',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        err: exception,
      }),
      'Unhandled HTTP exception',
    );
  });

  it('supports string based exception responses', () => {
    const exception = new HttpException('Something broke', HttpStatus.INTERNAL_SERVER_ERROR);

    filter.catch(exception, createHttpArgumentsHost(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Something broke',
        error: 'Http',
        timestamp: expect.any(String),
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'http',
        method: 'HTTP',
        path: 'unknown-path',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Http',
        message: 'Something broke',
      }),
      'Handled HTTP exception',
    );
  });

  it('falls back to Error when the derived exception name is empty', () => {
    class NamelessException extends HttpException {
      override name = 'Exception';
    }

    const exception = new NamelessException('Broken string response', HttpStatus.BAD_REQUEST);

    filter.catch(exception, createHttpArgumentsHost(response));

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Broken string response',
        error: 'Error',
      }),
    );
  });

  it('falls back to a humanized status label when the error field is missing', () => {
    const exception = new BadRequestException({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Bad payload',
    });

    filter.catch(exception, createHttpArgumentsHost(response));

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Bad payload',
        error: 'Bad Request',
      }),
    );
  });

  it('falls back to a generic label when the status code is unknown', () => {
    const exception = new BadRequestException({
      statusCode: 999,
    });
    jest.spyOn(exception, 'getStatus').mockReturnValue(999);

    filter.catch(exception, createHttpArgumentsHost(response));

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 999,
        message: 'Error',
        error: 'Error',
      }),
    );
  });
});
