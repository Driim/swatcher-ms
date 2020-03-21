/* eslint-disable @typescript-eslint/no-unused-vars */
import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { Serial } from './serial.model';
import { Fan } from './fan.model';

@Entity()
export class Subscription {
  @OneToOne((type) => Serial)
  @JoinColumn()
  serial: Serial;

  @Column((type) => Fan)
  fans: Fan[];
}
