import { Module } from '@nestjs/common';
import { UIService } from './ui.service';
import { UIController } from './ui.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TRANSPORT_SERVICE } from '../app.constants';
import { UserModule } from '../user/user.module';

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
  ],
  providers: [UIService],
  controllers: [UIController],
})
export class UIModule {}
