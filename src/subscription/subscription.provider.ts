import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SUBS_COLLECTION, MAX_FREE_SERIALS } from '../app.constants';
import { Serial, SubscriptionPopulated, User, Subscription, FanInterface } from '../interfaces';
import { SwatcherBadRequestException, SwatcherLimitExceedException } from '../exceptions';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectModel(SUBS_COLLECTION)
    private populatedSubscription: Model<SubscriptionPopulated>,
    @InjectModel(SUBS_COLLECTION)
    private subscription: Model<Subscription>,
  ) {}

  private async getSubscription(serial: Serial): Promise<SubscriptionPopulated> {
    const subscriptions = await this.findBySerials([serial]);
    return subscriptions[0];
  }

  async findBySerials(serials: Serial[]): Promise<SubscriptionPopulated[]> {
    return this.populatedSubscription
      .find({ serial: { $in: serials } })
      .populate('serial')
      .exec();
  }

  async findByUser(user: User): Promise<SubscriptionPopulated[]> {
    return this.populatedSubscription
      .find({ 'fans.user': user._id })
      .populate('serial')
      .exec();
  }

  findFan(user: User, subs: SubscriptionPopulated): FanInterface {
    return subs.fans.find((fan) => String(fan.user) == String(user._id));
  }

  async addSubscription(user: User, serial: Serial): Promise<SubscriptionPopulated> {
    if (user.payed === 0) {
      const subs = await this.findByUser(user);
      if (subs.length > MAX_FREE_SERIALS) {
        this.logger.log(`Пользовтель ${user.id} израсходовал лимит подписок`);
        throw new SwatcherLimitExceedException(user, serial.name);
      }
    }

    let subscription = await this.getSubscription(serial);
    if (!subscription) {
      // create new subscription
      const subs = new this.subscription();
      subs.serial = new Types.ObjectId(String(serial._id));
      await subs.save();

      // to populate serial
      subscription = await this.getSubscription(serial);
    }

    const alreadySubscribed = this.findFan(user, subscription);
    if (!alreadySubscribed) {
      this.logger.log(`Подписали ${user.id} на ${serial.name}`);
      subscription.fans.push({ user: user._id, voiceover: [] });
      await subscription.save();
    }

    return subscription;
  }

  async removeSubscription(user: User, serial: Serial): Promise<void> {
    const subscription = await this.getSubscription(serial);
    if (!subscription) {
      throw new SwatcherBadRequestException(user, serial.name);
    }

    const index = subscription.fans.findIndex((item) => String(item.user) == String(user._id));
    if (index === -1) {
      throw new SwatcherBadRequestException(user, serial.name);
    }

    subscription.fans.splice(index, 1);
    await subscription.save();
  }

  async clearSubscriptions(user: User): Promise<void> {
    const subscriptions = await this.findByUser(user);

    for (const subscription of subscriptions) {
      const index = subscription.fans.findIndex((value) => value.user === user._id);

      subscription.fans.splice(index, 1);
      await subscription.save();
    }
  }

  async getSubscribers(id: string): Promise<FanInterface[]> {
    const subs = await this.subscription
      .findOne({ serial: id })
      .populate('fans.user')
      .exec();

    if (!subs) {
      return [];
    }

    return subs.fans;
  }
}
