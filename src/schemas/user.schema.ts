import { Schema } from 'mongoose';

export const UserSchema = new Schema({
  id: {
    type: Number,
    index: true,
  },
  username: String,
  /* not active means user blocked bot or somethings else */
  active: Boolean,
  payed: Number,
  type: String,
});
