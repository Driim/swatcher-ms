import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SUBS_COLLECTION } from '../../app.constants';
import { SubscriptionSchema } from '../../schemas';
import { SubscriptionService } from './subscription.provider';

@Module({
  imports: [MongooseModule.forFeature([{ name: SUBS_COLLECTION, schema: SubscriptionSchema }])],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
