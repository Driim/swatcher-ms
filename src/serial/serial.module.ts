import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SerialName } from '../app.constants';
import { SerialSchema } from '../schemas';
import { SerialService } from './serial.provider';

@Module({
  imports: [MongooseModule.forFeature([{ name: SerialName, schema: SerialSchema }])],
  providers: [SerialService],
  exports: [SerialService],
})
export class SerialModule {}
