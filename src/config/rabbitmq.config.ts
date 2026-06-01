// src/config/rabbitmq.config.ts
import { registerAs } from '@nestjs/config';
require('dotenv').config();

export default registerAs('rabbitmq', () => ({
  uri: process.env.RABBITMQ_URI || 'amqp://localhost:5672',
  exchange: process.env.RABBITMQ_EXCHANGE || 'app_exchange',
  exchangeType: process.env.RABBITMQ_EXCHANGE_TYPE || 'direct',
  queues: [
    {
      name: 'skalebot.wca.outbound.queue',
      routingKeys: ['wca.outbound.message'],
    },
  ],
}));
