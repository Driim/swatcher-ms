import { Schema } from 'mongoose';
import { SERIAL_COLLECTION } from '../app.constants';

export const AnnounceSchema = new Schema({
  name: String,
  date: Date,
  season: String,
  series: String,
  studio: String,
  serial: {
    type: Schema.Types.ObjectId,
    ref: SERIAL_COLLECTION,
  },
});
