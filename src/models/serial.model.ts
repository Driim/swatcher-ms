import { Entity, Column, ObjectIdColumn, ObjectID, Index } from 'typeorm';
import { Season } from './season.model';

@Entity()
export class Serial {
  @ObjectIdColumn()
  id: ObjectID;

  @Column()
  @Index()
  name: string;

  @Column()
  @Index()
  alias: string[];

  @Column()
  genre: string[];

  @Column()
  country: string[];

  @Column()
  director: string[];

  @Column()
  voiceover: string[];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @Column((type) => Season)
  season: Season[];
}
