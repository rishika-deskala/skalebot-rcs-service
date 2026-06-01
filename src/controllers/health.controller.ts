import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from '../services/health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) { }

    @Get()
    @ApiOperation({ summary: 'Check service health' })
    @ApiResponse({
        status: 200,
        description: 'Service health status',
        schema: {
            example: { status: 'Service is running', timestamp: '2026-01-01T00:00:00Z' },
        },
    })
    checkHealth(): { status: string; timestamp: string } {
        return this.healthService.getStatus();
    }
}
