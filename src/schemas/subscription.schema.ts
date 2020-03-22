import { Schema } from 'mongoose';
import { SerialName, UserName } from '../app.constants';

export const SubscriptionSchema = new Schema({
  serial: {
    type: Schema.Types.ObjectId,
    ref: SerialName,
    unique: true,
  },
  fans: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: UserName,
      },
      voiceover: [String],
    },
  ],
});
