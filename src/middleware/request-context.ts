// src/observability/request-context.ts
import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContextStore = {
  chainId?: string;
  sessionId?: string;
  companyId?: string;
  userId?: string;
};

export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export const HEADER_CHAIN_ID = 'x-chain-id';
export const HEADER_SESSION_ID = 'x-session-id';
export const HEADER_COMPANY_ID = 'x-company-id';
export const HEADER_USER_ID = 'x-user-id';