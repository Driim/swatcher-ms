import { Injectable } from '@nestjs/common';
import { UserName } from '../app.constants';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../interfaces/user.interface';
import { SubscriptionService } from '../subscription/subscription.provider';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserName) private user: Model<User>,
    private readonly subscriptionsService: SubscriptionService,
  ) {}

  async create(id: number, username: string): Promise<User> {
    // new this.serial(dto)
    const user = new this.user();

    user.id = id;
    user.username = username;
    user.active = true;
    user.payed = 0;

    return user.save();
  }

  async setPayed(user: User): Promise<void> {
    user.payed = 1;
    await user.save();
  }

  async find(id: number): Promise<User> {
    const user = await this.user.findOne({ id });

    if (!user || !user.active) {
      return null;
    }

    return user;
  }

  async save(user: User): Promise<User> {
    const result = new this.user(user);
    return await result.save();
  }

  async block(id: number): Promise<void> {
    const user = await this.find(id);

    if (user) {
      user.active = false;
      this.save(user);

      this.subscriptionsService.clearSubscriptions(user);
    }
  }
}
