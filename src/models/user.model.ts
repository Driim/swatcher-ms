import { Entity, Column, ObjectIdColumn, ObjectID, Index } from 'typeorm';

@Entity()
export class User {
  @ObjectIdColumn()
  _id: ObjectID;

  @Index()
  @Column()
  id: number;

  @Column()
  name: string;

  @Column()
  username: string;

  @Column()
  active: boolean; /* not active means user blocked bot or somethings else */

  @Column()
  payed: number;
}
