import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { User } from '../models/user.model';
import { TRANSPORT_SERVICE } from '../app.constants';

@Injectable()
export class UserService {
  constructor(
    @Inject(TRANSPORT_SERVICE)
    private readonly client: ClientProxy,
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async create(id: number, username: string): Promise<User> {
    const user = new User();

    user.id = id;
    user.username = username;
    user.active = true;
    user.payed = 0;

    return this.save(user);
  }

  async find(id: number): Promise<User> {
    const user = await this.repo.findOne({ id });

    if (!user || !user.active) {
      return null;
    }

    return user;
  }

  async save(user: User): Promise<User> {
    return await this.repo.save(user);
  }

  async block(id: number): Promise<void> {
    const user = await this.find(id);

    if (user) {
      user.active = false;
      this.save(user);

      this.client.emit<void>('subscriptions_clear', id);
    }
  }
}
