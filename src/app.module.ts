import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SentryModule } from '@ntegral/nestjs-sentry';
import { LogLevel } from '@sentry/types';
import { SerialModule } from './domains/serial/serial.module';
import { UserModule } from './domains/user/user.module';
import { UIModule } from './application/ui/ui.module';
import { YandexModule } from './application/yandex/yandex.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
      }),
      inject: [ConfigService],
    }),
    SentryModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (cfg: ConfigService) => ({
        dsn: cfg.get('SENTRY_DSN'),
        debug: true,
        environment: 'production',
        release: null, // must create a release in sentry.io dashboard
        logLevel: LogLevel.Debug, //based on sentry.io loglevel //
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    SerialModule,
    UserModule,
    UIModule,
    YandexModule,
  ],
})
export class AppModule {}
