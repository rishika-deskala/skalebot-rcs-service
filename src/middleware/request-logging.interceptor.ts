import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Request, Response } from 'express';
import { AppLogger } from '../logger/logger.module';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    
    // Extract request information
    const method = req.method;
    const endpoint = req.originalUrl || req.url;
    const timestamp = new Date().toISOString();
    const clientIp = this.getClientIp(req);
    const userAgent = req.get('User-Agent') || 'Unknown';
    const startTime = Date.now();
    
    // Log the incoming request
    this.logger.log({
      message: 'Incoming API Request',
      method,
      endpoint,
      timestamp,
      clientIp,
      userAgent,
      headers: {
        host: req.get('host'),
        'content-type': req.get('content-type'),
        origin: req.get('origin'),
        referer: req.get('referer')
      }
    }, 'RequestLoggingInterceptor');

    return next.handle().pipe(
      tap(() => {
        // Log successful response
        const duration = Date.now() - startTime;
        this.logger.log({
          message: 'Request Completed',
          method,
          endpoint,
          clientIp,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        }, 'RequestLoggingInterceptor');
      }),
      catchError((error) => {
        // Log request errors (this will catch route-level errors)
        const duration = Date.now() - startTime;
        this.logger.error({
          message: 'Request Error',
          method,
          endpoint,
          clientIp,
          userAgent,
          error: error.message,
          statusCode: error.status || 500,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        }, 'RequestLoggingInterceptor');
        
        return throwError(() => error);
      })
    );
  }

  private getClientIp(req: Request): string {
    // Check various headers to get the real client IP
    const xForwardedFor = req.get('x-forwarded-for');
    const xRealIp = req.get('x-real-ip');
    const cfConnectingIp = req.get('cf-connecting-ip'); // Cloudflare
    const xClientIp = req.get('x-client-ip');
    
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
    return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'Unknown';
  }
}