import { Schema } from 'mongoose';
import { SERIAL_COLLECTION, USER_COLLECTION } from '../app.constants';

export const SubscriptionSchema = new Schema({
  serial: {
    type: Schema.Types.ObjectId,
    ref: SERIAL_COLLECTION,
    unique: true,
  },
  fans: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: USER_COLLECTION,
      },
      voiceover: [String],
    },
  ],
});
