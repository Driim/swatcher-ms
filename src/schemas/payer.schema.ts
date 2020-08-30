import { Schema } from 'mongoose';
import { USER_COLLECTION } from '../app.constants';

export const PayerSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: USER_COLLECTION,
  },
  date: Date,
  amount: Number,
});
