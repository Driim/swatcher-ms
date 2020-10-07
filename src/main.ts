import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.REDIS,
  });

  app.listen(() => Logger.log('User Interface microservice started'));
}

bootstrap().then(
  () => {},
  () => {},
);
