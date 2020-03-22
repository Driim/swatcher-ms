import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubsName } from '../app.constants';
import { SubscriptionSchema } from '../schemas';
import { SubscriptionService } from './subscription.provider';

@Module({
  imports: [MongooseModule.forFeature([{ name: SubsName, schema: SubscriptionSchema }])],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
