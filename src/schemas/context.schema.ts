import { Schema } from 'mongoose';
import { USER_COLLECTION, SUBS_COLLECTION } from '../app.constants';

export const ContextSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: USER_COLLECTION,
    index: true,
  },
  subscription: {
    type: Schema.Types.ObjectId,
    ref: SUBS_COLLECTION,
  },
});
