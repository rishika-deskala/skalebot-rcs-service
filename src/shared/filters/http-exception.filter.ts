import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLogger } from '../../logger/logger.module';

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger?: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let stack: string | undefined;
    let data: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        error = (exceptionResponse as any).error || exception.name || error;
        data = exceptionResponse; // Include the full response object as data
      }
      stack = exception.stack;
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
      stack = exception.stack;
    }

    // Get detailed request information
    const clientIp = this.getClientIp(request);
    const userAgent = request.get('User-Agent') || 'Unknown';
    const timestamp = new Date().toISOString();
    const method = request.method;
    const endpoint = request.originalUrl || request.url;

    // Enhanced logging with request details for NewRelic and monitoring
    const logData = {
      message: `${error}: ${message}`,
      method,
      endpoint,
      timestamp,
      clientIp,
      userAgent,
      statusCode: status,
      headers: {
        host: request.get('host'),
        'content-type': request.get('content-type'),
        origin: request.get('origin'),
        referer: request.get('referer'),
        'x-forwarded-for': request.get('x-forwarded-for'),
        'x-real-ip': request.get('x-real-ip'),
      },
      query: Object.keys(request.query).length > 0 ? request.query : undefined,
      body: request.method !== 'GET' && Object.keys(request.body || {}).length > 0 ? request.body : undefined,
      stackTrace: stack, // Include stack in logs for NewRelic
    };

    // Use structured logging if logger is available, otherwise fallback to console
    if (this.logger) {
      this.logger.error(logData, 'AllExceptionsFilter');
    } else {
      console.error(`[${timestamp}] ${method} ${endpoint} - ${error}: ${message}`);
      console.error(`Client IP: ${clientIp}, User-Agent: ${userAgent}`);
      if (stack) {
        console.error(stack);
      }
    }

    // Return only statusCode, error, and message to the API consumer
    const errorResponse: any = {
      statusCode: status,
      error: error,
      message: message,
    };

    // Include data if it exists (when exceptionResponse was an object)
    if (data) {
      errorResponse.data = data;
    }

    response.status(status).json(errorResponse);
  }

  private getClientIp(request: Request): string {
    // Check various headers to get the real client IP
    const xForwardedFor = request.get('x-forwarded-for');
    const xRealIp = request.get('x-real-ip');
    const cfConnectingIp = request.get('cf-connecting-ip'); // Cloudflare
    const xClientIp = request.get('x-client-ip');
    
    if (xForwardedFor) {
      // X-Forwarded-For can contain multiple IPs, the first one is the client
      return xForwardedFor.split(',')[0].trim();
    }
    
    if (xRealIp) {
      return xRealIp;
    }
    
    if (cfConnectingIp) {
      return cfConnectingIp;
    }
    
    if (xClientIp) {
      return xClientIp;
    }
    
    // Fallback to req.ip (Express default)
    return request.ip || request.connection?.remoteAddress || request.socket?.remoteAddress || 'Unknown';
  }
}
