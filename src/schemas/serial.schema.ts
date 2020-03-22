import { Schema } from 'mongoose';

export const SerialSchema = new Schema({
  name: {
    type: String,
    index: true,
  },
  alias: {
    type: [String],
    index: true,
  },
  genre: [String],
  country: [String],
  director: [String],
  voiceover: [String],
  season: [
    {
      name: String,
      desc: String,
      img: String,
      url: String,
      starts: Number,
      actors: [String],
    },
  ],
});
