import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UIController } from './ui/controllers/ui.controller';
import { UIService } from './ui/providers/ui.service';
import { TRANSPORT_SERVICE } from './app.constants';
import { Transport } from '@nestjs/common/enums/transport.enum';
import { SerialModule } from './serial/serial.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(),
    ClientsModule.register([
      {
        name: TRANSPORT_SERVICE,
        transport: Transport.REDIS,
        options: { url: 'redis://localhost:6379' },
      },
    ]),
    SerialModule,
  ],
  controllers: [UIController],
  providers: [UIService],
})
export class AppModule {}
