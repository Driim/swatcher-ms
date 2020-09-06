import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { YandexService } from './yandex.service';
import { UserModule } from '../../domains/user';
import { PAYER_COLLECTION } from '../../app.constants';
import { PayerSchema } from '../../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: PAYER_COLLECTION, schema: PayerSchema }]),
    UserModule,
  ],
  providers: [YandexService],
})
export class YandexModule {}
