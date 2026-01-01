import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { DirectChatController } from './direct-chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { RedisService } from './redis.service';
import { WsJwtGuard } from './ws-jwt.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secret_key',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [ChatController, DirectChatController],
  providers: [ChatService, ChatGateway, RedisService, WsJwtGuard],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
