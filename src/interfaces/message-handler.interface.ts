import { User } from '../interfaces/user.interface';

export interface MessageHander {
  handle: (user: User, message: string) => Promise<void>;
  regexp: RegExp;
}
