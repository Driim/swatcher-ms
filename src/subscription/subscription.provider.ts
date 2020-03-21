import { Injectable, Logger } from '@nestjs/common';
import { Subscription } from '../models/subscription.model';
import { Serial } from '../models/serial.model';
import { User } from '../models/user.model';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor() {}

  async findBySerials(serials: Serial[]): Promise<Subscription[]> {}
  async findByUser(user: User): Promise<Subscription[]> {}
  async addSubscription(serial: Serial, user: User): Promise<void> {}
  async removeSubscription(serial: Serial, user: User): Promise<void> {}
  async clearSubscription(user: number): Promise<void> {}
  async addVoiceover(serial: Serial, user: User, voiceover: string): Promise<string[]> {}
  async clearVoiceover(serial: Serial, user: User): Promise<void> {}
}
