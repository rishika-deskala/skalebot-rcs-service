import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContextData = {
  chainId: string;
  method?: string;
  path?: string;
  startedAt?: number;
  meta?: Record<string, any>;
};

const als = new AsyncLocalStorage<RequestContextData>();

export const RequestContext = {
  run<T>(data: RequestContextData, fn: () => T) {
    return als.run(data, fn);
  },
  get(): RequestContextData | undefined {
    return als.getStore();
  },
  set<K extends keyof RequestContextData>(key: K, value: RequestContextData[K]) {
    const store = als.getStore();
    if (store) (store as any)[key] = value;
  },
};
