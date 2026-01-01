import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface OnlineUser {
  userId: string;
  username: string;
  fullName: string;
  avatarUrl?: string | null;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger('RedisService');
  private readonly client: Redis;
  private readonly TTL = 3600; // 1 hour TTL for keys

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    this.client = new Redis({
      host,
      port,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      this.logger.log(`✅ Connected to Redis at ${host}:${port}`);
    });

    this.client.on('error', (err) => {
      this.logger.error('❌ Redis connection error:', err);
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  // === User Sockets Management ===
  async addUserSocket(userId: string, socketId: string): Promise<void> {
    await this.client.sadd(`user:${userId}:sockets`, socketId);
    await this.client.expire(`user:${userId}:sockets`, this.TTL);
  }

  async removeUserSocket(userId: string, socketId: string): Promise<void> {
    await this.client.srem(`user:${userId}:sockets`, socketId);
  }

  async getUserSockets(userId: string): Promise<string[]> {
    return await this.client.smembers(`user:${userId}:sockets`);
  }

  async hasUserSockets(userId: string): Promise<boolean> {
    const count = await this.client.scard(`user:${userId}:sockets`);
    return count > 0;
  }

  // === Socket Channels Management ===
  async addSocketChannel(socketId: string, channelId: string): Promise<void> {
    await this.client.sadd(`socket:${socketId}:channels`, channelId);
    await this.client.expire(`socket:${socketId}:channels`, this.TTL);
  }

  async removeSocketChannel(
    socketId: string,
    channelId: string,
  ): Promise<void> {
    await this.client.srem(`socket:${socketId}:channels`, channelId);
  }

  async getSocketChannels(socketId: string): Promise<string[]> {
    return await this.client.smembers(`socket:${socketId}:channels`);
  }

  async deleteSocketChannels(socketId: string): Promise<void> {
    await this.client.del(`socket:${socketId}:channels`);
  }

  // === Channel Users Management ===
  async addChannelUser(
    channelId: string,
    userId: string,
    userData: OnlineUser,
  ): Promise<void> {
    await this.client.hset(
      `channel:${channelId}:users`,
      userId,
      JSON.stringify(userData),
    );
    await this.client.expire(`channel:${channelId}:users`, this.TTL);
  }

  async removeChannelUser(channelId: string, userId: string): Promise<void> {
    await this.client.hdel(`channel:${channelId}:users`, userId);
  }

  async getChannelUsers(channelId: string): Promise<OnlineUser[]> {
    const usersData = await this.client.hgetall(`channel:${channelId}:users`);
    return Object.values(usersData).map((data) => JSON.parse(data));
  }

  async getChannelUser(
    channelId: string,
    userId: string,
  ): Promise<OnlineUser | null> {
    const data = await this.client.hget(`channel:${channelId}:users`, userId);
    return data ? JSON.parse(data) : null;
  }

  async isUserInChannel(channelId: string, userId: string): Promise<boolean> {
    return (await this.client.hexists(`channel:${channelId}:users`, userId)) === 1;
  }

  // === Workspace Users Management ===
  async addWorkspaceUser(workspaceId: string, userId: string): Promise<void> {
    await this.client.sadd(`workspace:${workspaceId}:users`, userId);
    await this.client.expire(`workspace:${workspaceId}:users`, this.TTL);
  }

  async removeWorkspaceUser(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    await this.client.srem(`workspace:${workspaceId}:users`, userId);
  }

  async getWorkspaceUsers(workspaceId: string): Promise<string[]> {
    return await this.client.smembers(`workspace:${workspaceId}:users`);
  }

  async isUserInWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<boolean> {
    return (
      (await this.client.sismember(`workspace:${workspaceId}:users`, userId)) === 1
    );
  }

  // === Socket Workspace Management ===
  async setSocketWorkspace(
    socketId: string,
    workspaceId: string,
  ): Promise<void> {
    await this.client.set(`socket:${socketId}:workspace`, workspaceId);
    await this.client.expire(`socket:${socketId}:workspace`, this.TTL);
  }

  async getSocketWorkspace(socketId: string): Promise<string | null> {
    return await this.client.get(`socket:${socketId}:workspace`);
  }

  async deleteSocketWorkspace(socketId: string): Promise<void> {
    await this.client.del(`socket:${socketId}:workspace`);
  }

  // === Heartbeat Management ===
  async setHeartbeat(userId: string, timestamp: number): Promise<void> {
    await this.client.set(`heartbeat:${userId}`, timestamp.toString());
    await this.client.expire(`heartbeat:${userId}`, 120); // 2 minutes TTL
  }

  async getHeartbeat(userId: string): Promise<number | null> {
    const value = await this.client.get(`heartbeat:${userId}`);
    return value ? parseInt(value, 10) : null;
  }

  async getAllHeartbeats(): Promise<Map<string, number>> {
    const keys = await this.client.keys('heartbeat:*');
    const result = new Map<string, number>();

    for (const key of keys) {
      const userId = key.replace('heartbeat:', '');
      const value = await this.client.get(key);
      if (value) {
        result.set(userId, parseInt(value, 10));
      }
    }

    return result;
  }

  // === Utility Methods ===
  async countUserSocketsInWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<number> {
    const sockets = await this.getUserSockets(userId);
    let count = 0;

    for (const socketId of sockets) {
      const wsId = await this.getSocketWorkspace(socketId);
      if (wsId === workspaceId) {
        count++;
      }
    }

    return count;
  }

  async addChannelUserSocket(
    channelId: string,
    userId: string,
    socketId: string,
  ): Promise<void> {
    await this.client.sadd(`channel:${channelId}:user:${userId}:sockets`, socketId);
    await this.client.expire(`channel:${channelId}:user:${userId}:sockets`, this.TTL);
  }

  async removeChannelUserSocket(
    channelId: string,
    userId: string,
    socketId: string,
  ): Promise<void> {
    await this.client.srem(`channel:${channelId}:user:${userId}:sockets`, socketId);
  }

  async getChannelUserSockets(
    channelId: string,
    userId: string,
  ): Promise<string[]> {
    return await this.client.smembers(`channel:${channelId}:user:${userId}:sockets`);
  }

  async hasChannelUserSockets(
    channelId: string,
    userId: string,
  ): Promise<boolean> {
    const count = await this.client.scard(`channel:${channelId}:user:${userId}:sockets`);
    return count > 0;
  }
}
