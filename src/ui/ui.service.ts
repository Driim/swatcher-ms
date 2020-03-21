import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from '../models/user.model';
import {
  TRANSPORT_SERVICE,
  COMMAND_HELP,
  COMMAND_ID,
  COMMAND_NOT_THAT,
  COMMAND_NO_THANKS,
} from '../app.constants';
import { MessageHander } from '../interfaces/message-handler.interface';
import { MESSAGE_REMOVE_USER, MESSAGE_HELP, MESSAGE_NO_THANKS } from '../app.strings';
import { COMMAND_STOP } from '../app.constants';
import { Serial } from 'src/models/serial.model';

@Injectable()
export class UIService {
  private readonly logger = new Logger(UIService.name);
  private handlers: MessageHander[];
  private clearKeyboard = {
    // eslint-disable-next-line @typescript-eslint/camelcase
    reply_markup: JSON.stringify({ remove_keyboard: true }),
  };

  constructor(
    @Inject(TRANSPORT_SERVICE)
    private readonly client: ClientProxy,
  ) {
    this.handlers = [
      {
        handle: this.remove,
        regexp: COMMAND_STOP,
      },
      {
        handle: this.help,
        regexp: COMMAND_HELP,
      },
      {
        handle: this.id,
        regexp: COMMAND_ID,
      },
      {
        handle: this.noThanks,
        regexp: COMMAND_NOT_THAT,
      },
      {
        handle: this.noThanks,
        regexp: COMMAND_NO_THANKS,
      },
    ];
  }

  getHandlers(): MessageHander[] {
    return this.handlers;
  }

  async sendMessage(user: User, message: string, opts?: unknown): Promise<void> {
    this.client.emit<void>('send_message', { user: user.id, message, opts });
  }

  async find(user: User, message: string): Promise<void> {
    const serials = await this.client.send<Serial[], string>('serial_find', message).toPromise();
    const ids = serials.map((serial) => serial.id);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public remove = async (user: User, _message: string): Promise<void> => {
    this.logger.log(`Удаляем пользователя ${user.username}`);
    this.sendMessage(user, MESSAGE_REMOVE_USER);
    return this.client.emit<void>('user_block', user.id).toPromise();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public help = async (user: User, _message: string): Promise<void> => {
    return this.sendMessage(user, MESSAGE_HELP);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public noThanks = async (user: User, _message: string): Promise<void> => {
    return this.sendMessage(user, MESSAGE_NO_THANKS, this.clearKeyboard);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public id = async (user: User, _message: string): Promise<void> => {
    return this.sendMessage(user, String(user.id));
  };
}
