// src/observability/request-context.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { requestContext, HEADER_CHAIN_ID, HEADER_SESSION_ID, HEADER_COMPANY_ID, HEADER_USER_ID } from './request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const chainId = (req.headers[HEADER_CHAIN_ID] || req.headers[HEADER_CHAIN_ID.toLowerCase()]) as string | undefined;
    const sessionId = (req.headers[HEADER_SESSION_ID] || req.headers[HEADER_SESSION_ID.toLowerCase()]) as string | undefined;
    const companyId = (req.headers[HEADER_COMPANY_ID] || req.headers[HEADER_COMPANY_ID.toLowerCase()]) as string | undefined;
    const userId = (req.headers[HEADER_USER_ID] || req.headers[HEADER_USER_ID.toLowerCase()]) as string | undefined;
    
    let headerReq = {
      chainId: chainId,
      sessionId: sessionId,
      companyId: companyId,
      userId: userId,
    }
    requestContext.run(headerReq, () => next());
  }
}
