import { Document, Schema } from 'mongoose';

export interface Payer extends Document {
  date: Date;
  amount: number;
  user: Schema.Types.ObjectId;
}
