import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from '../models/user.model';
import { TRANSPORT_SERVICE } from '../app.constants';
import { MessageHander } from '../interfaces/message-handler.interface';

@Injectable()
export class UIService {
  private handlers: MessageHander[];
  constructor(
    @Inject(TRANSPORT_SERVICE)
    private readonly client: ClientProxy,
  ) {}

  getHandlers(): MessageHander[] {
    return this.handlers;
  }

  sendMessage(user: User, message: string, opts?: unknown): void {
    this.client.emit<void>('send_message', { user: user.id, message, opts });
  }

  async find(user: User, message: string): Promise<void> {
    return;
  }
}
