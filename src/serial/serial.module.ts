import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerialService } from './serial.provider';
import { SerialController } from './serial.controller';
import { Serial } from '../models/serial.model';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TRANSPORT_SERVICE } from 'src/app.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([Serial]),
    ClientsModule.register([
      {
        name: TRANSPORT_SERVICE,
        transport: Transport.REDIS,
        options: { url: 'redis://localhost:6379' },
      },
    ]),
  ],
  providers: [SerialService],
  controllers: [SerialController],
})
export class SerialModule {}
