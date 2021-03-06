/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Model } from 'mongoose';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CONTEXT_COLLECTION } from '../../app.constants';
import { ContextPopulated } from '../../interfaces/context.interface';
import { User, SubscriptionPopulated } from '../../interfaces';

@Injectable()
export class ContextService {
  private readonly logger = new Logger(ContextService.name);

  constructor(
    @InjectModel(CONTEXT_COLLECTION)
    private Context: Model<ContextPopulated>,
  ) {}

  public async createContext(user: User, subscription: SubscriptionPopulated): Promise<void> {
    await this.clearContext(user);

    const context = new this.Context();
    context.user = user._id;
    context.subscription = subscription._id;

    await context.save();
  }

  public async clearContext(user: User): Promise<void> {
    this.logger.log(`Удаляем контекст пользователя ${user.id}`);

    await this.Context.remove({ user: user._id });
  }

  public async getContext(user: User): Promise<ContextPopulated> {
    return this.Context.findOne({ user: user._id })
      .populate({
        path: 'subscription',
        populate: { path: 'serial' },
      })
      .exec();
  }
}
