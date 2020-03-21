import { JoinColumn, OneToOne, Column } from 'typeorm';
import { User } from './user.model';

export class Fan {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @OneToOne((type) => User)
  @JoinColumn()
  user: User;

  @Column()
  voiceovers: string[];
}
