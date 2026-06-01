import { Injectable, NestMiddleware, Inject, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { RequestContext } from './request-context';

export interface ChainIdOptions { headerName?: string; }

@Injectable()
export class ChainIdMiddleware implements NestMiddleware {
  constructor(@Optional() @Inject('CHAINID_OPTIONS') private opts: ChainIdOptions = {}) {}

  use(req: Request, res: Response, next: NextFunction) {
    const headerName = (this.opts.headerName || process.env.CHAIN_ID_HEADER || 'x-chain-id').toLowerCase();
    const incoming = (req.headers[headerName] as string) || '';
    const chainId = incoming || randomUUID();
    const startedAt = Date.now();

    RequestContext.run(
      { chainId, method: req.method, path: req.originalUrl || req.url, startedAt, meta: {} },
      () => { res.setHeader(headerName, chainId); next(); },
    );
  }
}
