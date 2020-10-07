import { User } from './user.interface';

export interface MessageHander {
  handle: (user: User, message: string) => Promise<void>;
  regexp: RegExp;
}
