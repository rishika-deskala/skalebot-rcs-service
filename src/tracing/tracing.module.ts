// src/tracing/tracing.module.ts
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { ChainIdMiddleware } from './chainid.middleware';
import { InMemoryTraceStore } from './trace-store';
import { LoggingInterceptor } from './logging.interceptor';
import type { TraceStore } from './trace-store';

// OpenTelemetry
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

export type TracingConfig = {
  serviceName?: string;           // OTEL_SERVICE_NAME (env) takes precedence if present
  serviceVersion?: string;
  otlpEndpoint?: string;          // full URL; will be coerced to end with /v1/traces
  otlpHeaders?: Record<string, string>; // e.g. { Authorization: 'Basic ...' }
  chainIdHeader?: string;         // default: x-chain-id
  ttlMs?: number;                 // in-memory request snapshot TTL
};

export const TRACE_STORE_TOKEN = 'TRACE_STORE';
export const CHAINID_OPTIONS = 'CHAINID_OPTIONS';

function parseHeadersEnv(h?: string): Record<string, string> | undefined {
  if (!h) return undefined;
  // Example: "Authorization=Basic abc123,Another=xyz"
  return Object.fromEntries(
    h.split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const i = p.indexOf('=');
        return i > 0 ? [p.slice(0, i).trim(), p.slice(i + 1).trim()] : [p.trim(), ''];
      }),
  );
}

function joinUrl(base: string, suffix: string) {
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const s = suffix.startsWith('/') ? suffix : `/${suffix}`;
  return `${b}${s}`;
}

function resolveTracesEndpoint(cfg?: string): string | undefined {
  // Priority: explicit cfg -> OTEL_EXPORTER_OTLP_TRACES_ENDPOINT -> OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/traces'
  console.log('Resolving traces endpoint...');
  const envTraces = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
  const envBase = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  console.log(envTraces);
  console.log(envBase);
  const url = cfg ?? envTraces ?? (envBase ? joinUrl(envBase, '/v1/traces') : undefined);
  if (!url) return undefined;
  return /\/v1\/traces\/?$/.test(url) ? url : joinUrl(url, '/v1/traces');
}

@Global()
@Module({})
export class TracingModule {
  static forRoot(cfg: TracingConfig = {}): DynamicModule {
    // Prefer standard OTel envs
    const serviceName =
      process.env.OTEL_SERVICE_NAME ??
      cfg.serviceName ??
      process.env.SERVICE_NAME ??
      'nestjs-api';

    const serviceVersion = cfg.serviceVersion ?? process.env.SERVICE_VERSION ?? '0.0.1';

    const otlpEndpoint = resolveTracesEndpoint(cfg.otlpEndpoint);
    const otlpHeaders =
      cfg.otlpHeaders ?? parseHeadersEnv(process.env.OTEL_EXPORTER_OTLP_HEADERS);
    
    const chainIdHeader = cfg.chainIdHeader ?? process.env.CHAIN_ID_HEADER ?? 'x-chain-id';
    const ttlMs = cfg.ttlMs ?? Number(process.env.TRACE_TTL_MS ?? 15 * 60 * 1000);

    // Exporter (OTLP/HTTP). If no endpoint, SDK still starts but won't export.
    const traceExporter = otlpEndpoint
      ? new OTLPTraceExporter({ url: otlpEndpoint, headers: otlpHeaders })
      : undefined;

    console.log(traceExporter ? `Tracing to ${otlpEndpoint}` : 'Tracing disabled');

    // Build resource without deprecated enums or Resource constructor
    const resource = defaultResource().merge(
      resourceFromAttributes({
        [ATTR_SERVICE_NAME]: serviceName,
        [ATTR_SERVICE_VERSION]: serviceVersion,
      }),
    );

    const sdk = new NodeSDK({
      resource,
      traceExporter,
      instrumentations: [getNodeAutoInstrumentations()],
    });

    // Start immediately (works whether start() returns void or Promise)
    (async () => {
      try {
        await Promise.resolve((sdk as any).start());
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('OpenTelemetry SDK start error:', err);
      }
    })();

    // Graceful shutdown (also version-safe)
    const graceful = async () => {
      try {
        await Promise.resolve((sdk as any).shutdown());
      } catch {
        // ignore
      } finally {
        process.exit(0);
      }
    };
    process.on('SIGTERM', graceful);
    process.on('SIGINT', graceful);

    const TraceStoreProvider: Provider = {
      provide: TRACE_STORE_TOKEN,
      useFactory: () => new InMemoryTraceStore(ttlMs),
    };

    const ChainIdOptionsProvider: Provider = {
      provide: CHAINID_OPTIONS,
      useValue: { headerName: chainIdHeader },
    };

    const AppInterceptorProvider: Provider = {
      provide: APP_INTERCEPTOR,
      useFactory: (store: TraceStore) => new LoggingInterceptor(store),
      inject: [TRACE_STORE_TOKEN],
    };

    return {
      module: TracingModule,
      providers: [
        TraceStoreProvider,
        ChainIdOptionsProvider,
        AppInterceptorProvider,
        ChainIdMiddleware,
      ],
      exports: [TRACE_STORE_TOKEN, CHAINID_OPTIONS, ChainIdMiddleware],
    };
  }
}
