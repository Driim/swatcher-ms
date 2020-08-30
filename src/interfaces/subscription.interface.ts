import { Document, Schema, Types } from 'mongoose';
import { Serial } from './serial.interface';
import { User } from './user.interface';

export interface FanInterface {
  user: Types.ObjectId | User;
  voiceover: string[];
}

interface SubscriptionBase extends Document {
  fans: FanInterface[];
}

export interface Subscription extends SubscriptionBase {
  serial: Types.ObjectId;
}

export interface SubscriptionSerialSchema extends SubscriptionBase {
  serial: Schema.Types.ObjectId;
}

export interface SubscriptionPopulated extends SubscriptionBase {
  serial: Serial;
}
