import { Injectable } from '@nestjs/common';
import { USER_COLLECTION } from '../../app.constants';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../interfaces/user.interface';
import { SubscriptionService } from '../subscription/subscription.provider';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(USER_COLLECTION) private user: Model<User>,
    private readonly subscriptionsService: SubscriptionService,
  ) {}

  async create(id: number, username: string): Promise<User> {
    /** check if user already in DB */
    let user = await this.user.findOne({ id });
    if (user) {
      user.username = username;
      user.active = true;
    } else {
      user = new this.user();
      user.id = id;
      user.username = username;
      user.active = true;
      user.payed = 0;
      user.type = 'telegram'
    }

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
