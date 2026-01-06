import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: async () => {
        const url = process.env.REDIS_URL;
        const client = url
          ? new Redis(url, { maxRetriesPerRequest: 2 })
          : new Redis({
              host: process.env.REDIS_HOST || '127.0.0.1',
              port: +(process.env.REDIS_PORT || 6379),
              password: process.env.REDIS_PASSWORD || undefined,
              maxRetriesPerRequest: 2,
            });
        // 提前建连，启动期暴露连接错误
        await client.ping();
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
