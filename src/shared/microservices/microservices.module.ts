// microservices/microservices.module.ts
import { Module } from '@nestjs/common';
import { MicroserviceProviders } from './microservices.providers';

@Module({
  providers: [...MicroserviceProviders],
  exports: [...MicroserviceProviders], // 👈 make them injectable in other modules
})
export class MicroservicesModule {}
