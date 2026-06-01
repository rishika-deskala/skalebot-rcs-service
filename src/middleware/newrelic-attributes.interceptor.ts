// src/observability/newrelic-attributes.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as newrelic from 'newrelic';
import { requestContext } from './request-context';

@Injectable()
export class NewRelicAttributesInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const store = requestContext.getStore();
    if (store) {
      // Adds attributes to the active transaction and span
      newrelic.addCustomAttributes({
        chainId: store.chainId || 'unknown',
        sessionId: store.sessionId || 'unknown',
        companyId: store.companyId || 'unknown',
        userId: store.userId || 'unknown',
      });
    }
    return next.handle();
  }
}
