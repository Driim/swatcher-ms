import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionSchema } from '../schemas/subscription.schema';
import { SubscriptionService } from './subscription.provider';
import { SubsName } from '../app.constants';

@Module({
  imports: [MongooseModule.forFeature([{ name: SubsName, schema: SubscriptionSchema }])],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
