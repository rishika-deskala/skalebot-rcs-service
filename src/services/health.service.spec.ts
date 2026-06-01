import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from '../services/health.service';

describe('HealthService', () => {
    let service: HealthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [HealthService],
        }).compile();

        service = module.get<HealthService>(HealthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getStatus', () => {
        it('should return status and timestamp', () => {
            const result = service.getStatus();
            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('timestamp');
            expect(result.status).toBe('Service is running');
        });

        it('should return a valid ISO timestamp', () => {
            const result = service.getStatus();
            const timestamp = new Date(result.timestamp);
            expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
        });
    });
});
