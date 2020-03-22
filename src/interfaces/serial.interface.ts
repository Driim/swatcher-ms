import { Document, Schema } from 'mongoose';
import { Season } from '../models/season.model';

export interface Serial extends Document {
  _id: Schema.Types.ObjectId;
  name: string;
  alias: string[];
  genre: string[];
  country: string[];
  director: string[];
  voiceover: string[];
  season: Season[];
}
