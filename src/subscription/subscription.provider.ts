import { Injectable, Logger } from '@nestjs/common';
import { Serial } from '../interfaces/serial.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubscriptionPopulated } from '../interfaces/subscription.interface';
import { SubsName } from '../app.constants';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(@InjectModel(SubsName) private subscription: Model<SubscriptionPopulated>) {}

  async findBySerials(serials: Serial[]): Promise<SubscriptionPopulated[]> {
    const ids = serials.map((serial) => serial._id);
    console.log(ids);
    /* TODO: solve problem */
    return this.subscription
      .find({ serial: { $in: serials } })
      .populate('serial')
      .exec();
  }
  // async findByUser(user: User): Promise<Subscription[]> {}
  // async addSubscription(serial: Serial, user: User): Promise<void> {}
  // async removeSubscription(serial: Serial, user: User): Promise<void> {}
  // async clearSubscription(user: number): Promise<void> {}
  // async addVoiceover(serial: Serial, user: User, voiceover: string): Promise<string[]> {}
  // async clearVoiceover(serial: Serial, user: User): Promise<void> {}
}
