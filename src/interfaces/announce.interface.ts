import { Document, Schema } from 'mongoose';

export interface Announce extends Document {
  name: string;
  date: Date;
  season: string;
  series: string;
  studio?: string;
  serial: Schema.Types.ObjectId;
}
