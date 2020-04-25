import { Document, Schema } from 'mongoose';
import { SubscriptionPopulated } from './subscription.interface';

interface ContextBase extends Document {
  user: Schema.Types.ObjectId;
}

export interface Context extends ContextBase {
  subscription: SubscriptionPopulated['_id'];
}

export interface ContextPopulated extends Context {
  subscription: SubscriptionPopulated;
}