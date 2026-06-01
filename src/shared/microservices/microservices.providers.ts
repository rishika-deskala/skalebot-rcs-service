// microservices/microservices.providers.ts
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { MICROSERVICE } from '../constants/microservice.constants';

export const MicroserviceProviders = [
  {
    provide: MICROSERVICE.AUTH,
    inject: [ConfigService],
    useFactory: (configService: ConfigService) =>
      ClientProxyFactory.create({
        transport: Transport.TCP,
        options: { 
            host: configService.get<string>('AUTH_SERVICE_HOST'),
            port: configService.get<number>('AUTH_SERVICE_PORT')
        }, 
      }),
  },
  {
    provide: MICROSERVICE.SOCKET,
    inject: [ConfigService],
    useFactory: (configService: ConfigService) =>
      ClientProxyFactory.create({
        transport: Transport.TCP,
        options: { 
            host: configService.get<string>('SOCKET_SERVICE_HOST'),
            port: configService.get<number>('SOCKET_SERVICE_PORT')
        },
      }),
  },
];
