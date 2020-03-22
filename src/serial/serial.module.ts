import { Module } from '@nestjs/common';
import { SerialService } from './serial.provider';
import { SerialController } from './serial.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SerialSchema } from '../schemas/serial.schema';
import { SerialName } from '../app.constants';

@Module({
  imports: [MongooseModule.forFeature([{ name: SerialName, schema: SerialSchema }])],
  providers: [SerialService],
  controllers: [SerialController],
  exports: [SerialService],
})
export class SerialModule {}
