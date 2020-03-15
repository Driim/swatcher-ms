import { User } from '../models/user.model';

export interface MessageHander {
  handle: (user: User, message: string) => Promise<void>;
  regexp: RegExp;
}
