import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const httpCtx = ctx.switchToHttp();
    const req = httpCtx.getRequest<Request & { method: string; route?: any; url: string }>();
    const res = httpCtx.getResponse<any>();

    const method = (req?.method || 'GET').toUpperCase();
    // Nest sets req.route.path for registered routes; fallback to raw URL (beware cardinality)
    const route =
      (req as any)?.route?.path ||
      // For Fastify/Nest 10+, you can try:
      (res?.request?.routeOptions?.url) ||
      // last resort (less ideal):
      (req as any)?.originalUrl ||
      (req as any)?.url ||
      'unknown';

    const start = process.hrtime.bigint();

    return next.handle().pipe(
      tap(() => {
        const status = String(res?.statusCode ?? 200);
        const end = process.hrtime.bigint();
        const durSeconds = Number(end - start) / 1e9;

        this.metrics.httpRequestsTotal.inc({ method, route, status });
        this.metrics.httpRequestDuration.observe({ method, route, status }, durSeconds);
      }),
    );
  }
}
