import { Document, Schema } from 'mongoose';
import { User } from '../interfaces/user.interface';
import { Serial } from './serial.interface';

interface SubscriptionBase extends Document {
  fans: [
    {
      user: Schema.Types.ObjectId | User;
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
