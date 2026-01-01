import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { INestApplicationContext, Logger } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;
  private readonly logger = new Logger('RedisIoAdapter');

  constructor(
    app: INestApplicationContext,
    private readonly redisHost: string,
    private readonly redisPort: number,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<boolean> {
    const pubClient = createClient({
      socket: {
        host: this.redisHost,
        port: this.redisPort,
        connectTimeout: 5000,
      },
    });
    const subClient = pubClient.duplicate();

    try {
      await Promise.all([pubClient.connect(), subClient.connect()]);
      this.logger.log(
        `✅ Connected to Redis at ${this.redisHost}:${this.redisPort}`,
      );

      this.adapterConstructor = createAdapter(pubClient, subClient);
      return true;
    } catch (error) {
      this.logger.warn(
        `⚠️ Failed to connect to Redis at ${this.redisHost}:${this.redisPort}`,
      );
      this.logger.warn('⚠️ Using default in-memory adapter instead');
      return false;
    }
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
      this.logger.log('✅ Redis adapter attached to Socket.IO server');
    } else {
      this.logger.warn('⚠️ Redis adapter not initialized, using default adapter');
    }

    return server;
  }
}
