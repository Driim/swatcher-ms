import { Schema } from 'mongoose';
import { UserName, SubsName } from '../app.constants';

export const ContextSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: UserName,
    index: true
  },
  subscription: {
    type: Schema.Types.ObjectId,
    ref: SubsName
  }
});