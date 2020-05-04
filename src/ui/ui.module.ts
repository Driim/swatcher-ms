import { Module } from '@nestjs/common';
import { UIService } from './ui.service';
import { UIController } from './ui.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TRANSPORT_SERVICE } from '../app.constants';
import { UserModule } from '../user/user.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { SerialModule } from '../serial/serial.module';
import { ContextModule } from '../context/context.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: TRANSPORT_SERVICE,
        transport: Transport.REDIS,
        options: { url: 'redis://localhost:6379' },
      },
    ]),
    UserModule,
    SubscriptionModule,
    SerialModule,
    ContextModule
  ],
  providers: [UIService],
  controllers: [UIController],
})
export class UIModule {}
