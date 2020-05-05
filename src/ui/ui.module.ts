import { Module } from '@nestjs/common';
import { UIService } from './ui.service';
import { UIController } from './ui.controller';
import { Transport, ClientProxyFactory } from '@nestjs/microservices';
import { TRANSPORT_SERVICE } from '../app.constants';
import { UserModule } from '../user/user.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { SerialModule } from '../serial/serial.module';
import { ContextModule } from '../context/context.module';
import { ConfigService } from '@nestjs/config';
import { RedisOptions } from '@nestjs/common/interfaces/microservices/microservice-configuration.interface';

@Module({
  imports: [
    UserModule,
    SubscriptionModule,
    SerialModule,
    ContextModule,
  ],
  providers: [
    {
      provide: TRANSPORT_SERVICE,
      useFactory: (config: ConfigService) => {
        const options: RedisOptions = {
          transport: Transport.REDIS,
          options: {
            url: config.get<string>('REDIS_URI')
          }
        }
        return ClientProxyFactory.create(options);
      },
      inject: [ConfigService]
    },
    UIService
  ],
  controllers: [UIController],
})
export class UIModule {}
