import { Document } from 'mongoose';

export interface User extends Document {
  id: number;
  username: string;
  active: boolean;
  payed: number;
  type: string;
}
