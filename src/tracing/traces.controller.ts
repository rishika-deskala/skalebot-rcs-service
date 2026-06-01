// src/tracing/tracing.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { TRACE_STORE_TOKEN } from './tracing.module';

// Type-only imports to avoid circular DI tokens at runtime
import type { TraceStore, StoredTrace } from './trace-store';

type RedactQuery = {
  /** redact sensitive headers/body fields (default: true) */
  redact?: string | boolean;
};

@Controller('traces')
export class TracesController {
  constructor(
    @Inject(TRACE_STORE_TOKEN) private readonly store: TraceStore,
  ) {}

  @Get(':chainId')
  async getByChainId(
    @Param('chainId') chainId: string,
    @Query() query: RedactQuery,
  ): Promise<StoredTrace> {
    const rec = await this.store.get(chainId);
    if (!rec) throw new NotFoundException('Trace not found or expired');

    const shouldRedact =
      query.redact === undefined
        ? true
        : `${query.redact}`.toLowerCase() !== 'false';

    return shouldRedact ? redact(rec) : rec;
  }
}

/* ------------------------- helpers ------------------------- */

const SENSITIVE_HEADER_NAMES = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
]);
const SENSITIVE_HEADER_SUBSTRINGS = ['token', 'secret', 'apikey', 'api-key', 'key'];

const SENSITIVE_BODY_KEYS = new Set([
  'password',
  'pass',
  'secret',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'apiKey',
  'api_key',
]);

function redact<T extends StoredTrace>(t: T): T {
  const clone: any = { ...t };

  // headers
  if (clone.headers && typeof clone.headers === 'object') {
    const headers: Record<string, any> = {};
    for (const [k, v] of Object.entries(clone.headers)) {
      const lk = k.toLowerCase();
      const isSensitiveName = SENSITIVE_HEADER_NAMES.has(lk);
      const isSensitiveSubstring = SENSITIVE_HEADER_SUBSTRINGS.some((s) =>
        lk.includes(s),
      );
      headers[k] = isSensitiveName || isSensitiveSubstring ? mask(v) : v;
    }
    clone.headers = headers;
  }

  // body (best-effort; preserves primitives/arrays/objects)
  if (clone.body && typeof clone.body === 'object') {
    clone.body = redactObject(clone.body);
  }

  return clone as T;
}

function redactObject(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactObject);

  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_BODY_KEYS.has(k) || SENSITIVE_BODY_KEYS.has(k.toLowerCase())) {
      out[k] = mask(v);
    } else if (v && typeof v === 'object') {
      out[k] = redactObject(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function mask(_v: unknown): string {
  return '***redacted***';
}
