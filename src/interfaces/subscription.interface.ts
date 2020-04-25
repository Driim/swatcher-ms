import { Document, Schema } from 'mongoose';
import { Serial } from './serial.interface';

interface SubscriptionBase extends Document {
  fans: [
    {
      user: Schema.Types.ObjectId;
      voiceover: string[];
    },
  ];
}

export interface Subscription extends SubscriptionBase {
  serial: Serial['_id'];
}

export interface SubscriptionPopulated extends SubscriptionBase {
  serial: Serial;
}
