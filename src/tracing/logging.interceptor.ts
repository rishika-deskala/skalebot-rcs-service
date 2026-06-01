import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { RequestContext } from './request-context';
import { TraceStore } from './trace-store';
import { context, trace } from '@opentelemetry/api';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private store: TraceStore) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const http = ctx.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const rc = RequestContext.get();
    const startedAt = rc?.startedAt ?? Date.now();

    const span = trace.getSpan(context.active());
    if (span && rc?.chainId) {
      span.setAttribute('chain.id', rc.chainId);
      span.setAttribute('http.method', req.method);
      span.setAttribute('http.target', req.originalUrl || req.url);
    }

    // k8s envs
    const pod = {
      name: process.env.K8S_POD_NAME,
      uid: process.env.K8S_POD_UID,
      ns: process.env.K8S_NAMESPACE,
      node: process.env.K8S_NODE_NAME,
      container: process.env.K8S_CONTAINER_NAME,
    };
    if (span) {
      if (pod.name) span.setAttribute('k8s.pod.name', pod.name);
      if (pod.uid) span.setAttribute('k8s.pod.uid', pod.uid);
      if (pod.ns) span.setAttribute('k8s.namespace.name', pod.ns);
      if (pod.node) span.setAttribute('k8s.node.name', pod.node);
      if (pod.container) span.setAttribute('k8s.container.name', pod.container);
    }

    return next.handle().pipe(
      tap(async () => {
        const endedAt = Date.now();
        const durationMs = endedAt - startedAt;
        const chainId = rc?.chainId || 'unknown';

        if (span) {
          span.setAttribute('http.status_code', res.statusCode);
          span.setAttribute('app.request.duration_ms', durationMs);
          if (res.statusCode >= 500) span.setStatus({ code: 2 });
        }

        await this.store.save({
          chainId,
          method: req.method,
          path: req.originalUrl || req.url,
          statusCode: res.statusCode,
          startedAt,
          endedAt,
          durationMs,
          headers: req.headers as any,
          query: req.query as any,
          body: req.body,
          ip: req.ip,
          k8s: {
            podName: pod.name, podUid: pod.uid, namespace: pod.ns, nodeName: pod.node, containerName: pod.container,
          },
        });

        // eslint-disable-next-line no-console
        console.info(JSON.stringify({
          msg: 'request_completed',
          chainId, method: req.method, path: req.originalUrl || req.url, statusCode: res.statusCode, durationMs,
        }));
      }),
    );
  }
}
