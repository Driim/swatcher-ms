import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/common/enums/transport.enum';
import { Logger } from '@nestjs/common';
import 'reflect-metadata';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.REDIS,
  });
  app.listen(() => Logger.log('User Interface microservice started'));
}
bootstrap();
