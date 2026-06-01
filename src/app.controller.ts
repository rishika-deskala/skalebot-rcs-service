import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) { }

    @Get('health')
    @ApiOperation({ summary: 'Health check endpoint' })
    @ApiResponse({
        status: 200,
        description: 'Service is healthy',
        schema: {
            example: {
                status: 'ok',
                timestamp: '2026-06-01T00:00:00Z',
            },
        },
    })
    getHealth() {
        return this.appService.getHealth();
    }

    @Get()
    @ApiOperation({ summary: 'Welcome endpoint' })
    @ApiResponse({
        status: 200,
        description: 'Welcome message',
        schema: {
            example: {
                message: 'Welcome to WCA Service',
            },
        },
    })
    getWelcome() {
        return this.appService.getWelcome();
    }
}
