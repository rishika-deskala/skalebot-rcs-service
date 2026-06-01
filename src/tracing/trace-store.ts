export type StoredTrace = {
  chainId: string;
  method: string;
  path: string;
  statusCode: number;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, any>;
  body?: any;
  ip?: string;
  user?: any;
  k8s?: {
    podName?: string;
    podUid?: string;
    namespace?: string;
    nodeName?: string;
    containerName?: string;
  };
};

export interface TraceStore {
  save(trace: StoredTrace): Promise<void>;
  get(chainId: string): Promise<StoredTrace | undefined>;
}

export class InMemoryTraceStore implements TraceStore {
  private data = new Map<string, { v: StoredTrace; expires: number }>();
  constructor(private ttlMs = 15 * 60 * 1000) {}

  async save(v: StoredTrace) {
    this.data.set(v.chainId, { v, expires: Date.now() + this.ttlMs });
  }

  async get(chainId: string) {
    const rec = this.data.get(chainId);
    if (!rec) return undefined;
    if (rec.expires < Date.now()) {
      this.data.delete(chainId);
      return undefined;
    }
    return rec.v;
  }
}
