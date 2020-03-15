import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerialService } from './serial.provider';
import { SerialController } from './serial.controller';
import { Serial } from '../models/serial.model';

@Module({
  imports: [TypeOrmModule.forFeature([Serial])],
  providers: [SerialService],
  controllers: [SerialController],
  exports: [SerialService],
})
export class SerialModule {}
