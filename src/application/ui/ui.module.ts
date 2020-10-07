import { Module } from '@nestjs/common';
import { Transport, ClientProxyFactory, ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { UIService } from './ui.service';
import { UIController } from './ui.controller';
import { TRANSPORT_SERVICE } from '../../app.constants';
import { UserModule } from '../../domains/user/user.module';
import { SubscriptionModule } from '../../domains/subscription/subscription.module';
import { SerialModule } from '../../domains/serial/serial.module';
import { ContextModule } from '../../domains/context/context.module';

@Module({
  imports: [UserModule, SubscriptionModule, SerialModule, ContextModule],
  providers: [
    {
      provide: TRANSPORT_SERVICE,
      useFactory: (config: ConfigService): ClientProxy => {
        const options: any = {
          transport: Transport.REDIS,
          options: {
            url: config.get<string>('REDIS_URI'),
          },
        };
        return ClientProxyFactory.create(options);
      },
      inject: [ConfigService],
    },
    UIService,
  ],
  controllers: [UIController],
})
export class UIModule {}
