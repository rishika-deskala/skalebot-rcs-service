import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
    getStatus(): { status: string; timestamp: string } {
        return {
            status: 'Service is running',
            timestamp: new Date().toISOString(),
        };
    }
}
