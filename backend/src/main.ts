import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';
import cookieParser from 'cookie-parser';
import { RedisIoAdapter } from './chat/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.setGlobalPrefix('api');

  const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
  app.enableCors({
    origin: clientOrigin,
    credentials: true,
  });

  // Setup Redis adapter for Socket.IO clustering
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT;
  
  if (redisHost && redisPort) {
    console.log(`🔄 Attempting to connect to Redis at ${redisHost}:${redisPort}`);
    const redisIoAdapter = new RedisIoAdapter(
      app,
      redisHost,
      parseInt(redisPort, 10),
    );
    const connected = await redisIoAdapter.connectToRedis();
    if (connected) {
      app.useWebSocketAdapter(redisIoAdapter);
      console.log('✅ Redis adapter enabled for cross-server messaging');
    } else {
      console.log('⚠️ Redis connection failed, using local adapter only');
    }
  } else {
    console.log('ℹ️ Redis not configured, using default in-memory adapter');
  }

  const config = new DocumentBuilder()
    .setTitle('Workspace + Auth API')
    .setDescription('API quản lý Auth, Workspace, Channels, Posts')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const prisma = app.get(PrismaService);
  await prisma.$connect();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
