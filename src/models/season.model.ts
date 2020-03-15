import { Column } from 'typeorm';
export class Season {
  @Column()
  name: string;

  @Column()
  desc: string;

  @Column()
  img: string;

  @Column()
  url: string;

  @Column()
  starts: number; /* FIXME: can't be less than 1950 */

  @Column()
  actors: string[];
}
