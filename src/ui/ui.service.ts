import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from '../interfaces/user.interface';
import {
  TRANSPORT_SERVICE,
  COMMAND_HELP,
  COMMAND_ID,
  COMMAND_NOT_THAT,
  COMMAND_NO_THANKS,
  MAX_SEARCH_COUNT,
  COMMAND_LIST,
  COMMAND_UNSUBSCRIBE,
  MAX_FREE_SERIALS,
} from '../app.constants';
import { MessageHander } from '../interfaces/message-handler.interface';
import {
  MESSAGE_REMOVE_USER,
  MESSAGE_HELP,
  MESSAGE_OK,
  MESSAGE_ADD_SERIAL,
  MESSAGE_NO_THANKS,
  MESSAGE_FIND_ALL,
  MESSAGE_FIND_EXT,
  MESSAGE_SEND_ALIAS,
  MESSAGE_SEND_COUNTRY,
  MESSAGE_SEND_GENRE,
  MESSAGE_SEND_SEASONS,
  MESSAGE_LIST_REMOVE,
  MESSAGE_LIST_MESSAGE,
  MESSAGE_UNSUBSCRIBE,
  MESSAGE_SUBS_VOICEOVER,
  MESSAGE_SUBS_MESSAGE,
  MESSAGE_SUBS_ENOUTH,
  MESSAGE_SUBS_ALL,
  MESSAGE_SUBS_MESSAGE_PAYED
} from '../app.strings';
import { COMMAND_STOP } from '../app.constants';
import { Serial } from '../interfaces/serial.interface';
import { SwatcherNothingFoundException, SwatcherBadRequestException, SwatcherLimitExceedException } from '../exceptions';
import { SubscriptionService } from '../subscription/subscription.provider';
import { SerialService } from '../serial/serial.provider';
import { SubscriptionPopulated } from '../interfaces';

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
    private readonly subscriptionService: SubscriptionService,
    private readonly serialService: SerialService,
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
      {
        handle: this.list,
        regexp: COMMAND_LIST,
      },
      {
        handle: this.unsubscribe,
        regexp: COMMAND_UNSUBSCRIBE,
      }
    ];
  }

  private async sendSerialPreview(user: User, serial: Serial): Promise<void> {
    let message = `${serial.name} \n`;
    message += `${MESSAGE_SEND_ALIAS}: ${serial.alias.join(', ')} \n`;
    message += `${MESSAGE_SEND_COUNTRY}: ${serial.country.join(', ')}`;
    message += `${MESSAGE_SEND_GENRE}: ${serial.genre.join(', ')}`;
    message += `${MESSAGE_SEND_SEASONS}: ${serial.season.length}`;

    const img = serial.season
      .reduce((a, b) => parseInt(a.name) > parseInt(b.name) ? a : b)
      .img;

    const opts = {
      caption: message
    };

    return this.client
      .emit<void>('send_photo', { user: user.id, message: img, opts })
      .toPromise();
  }

  private async sendPreviewAndGenerateKeyboard(
    user: User,
    pattern: string,
    subscriptions: SubscriptionPopulated[]
  ): Promise<any> {
    const keyboard = [[]];

    for(const subs of subscriptions) {
      await this.sendSerialPreview(user, subs.serial);
      keyboard.push([`${pattern} ${subs.serial.name}`]);
    }

     keyboard.push([MESSAGE_NO_THANKS]);
     
     return {
       reply_markup: JSON.stringify({
         keyboard,
         one_time_keyboard: true,
         resize_keyboard: true
       })
     }
  }

  private async findSubscriptionBySerialName(user: User, name: string): Promise<SubscriptionPopulated> {
    const serial = await this.serialService.findExact(name);
    if (!serial) {
      throw new SwatcherNothingFoundException(user, name);
    }

    // find serial subscriptions
    const subscriptions = await this.subscriptionService.findBySerials([serial]);
    const subscription = subscriptions[0];
    if (!subscription) {
      throw new SwatcherBadRequestException(user, name);
    }

    return subscription;
  }

  private async createContext(user: User, subscription: SubscriptionPopulated): Promise<void> {
    // remove all contexts for user 
    // create new context and save it
  }

  public getHandlers(): MessageHander[] {
    return this.handlers;
  }

  async sendMessage(user: User, message: string, opts?: unknown): Promise<void> {
    return this.client
      .emit<void>('send_message', { user: user.id, message, opts })
      .toPromise();
  }

  public async find(user: User, message: string): Promise<void> {
    this.logger.log(`Ищем ${message} для пользователя ${user.id}`);
    const serials = await this.serialService.find(message);

    if (serials.length == 0) {
      throw new SwatcherNothingFoundException(user, message);
    }

    let subscriptions = await this.subscriptionService.findBySerials(serials);
    subscriptions = subscriptions
      .sort((a, b) => b.fans.length - a.fans.length)
      .slice(0, MAX_SEARCH_COUNT);

    const opts = await this.sendPreviewAndGenerateKeyboard(user, MESSAGE_ADD_SERIAL, subscriptions);

     return serials.length === subscriptions.length
      ? this.sendMessage(user, MESSAGE_FIND_ALL, opts)
      : this.sendMessage(user, MESSAGE_FIND_EXT(serials.length), opts);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public remove = async (user: User, _message: string): Promise<void> => {
    this.logger.log(`Удаляем пользователя ${user.id}`);
    this.sendMessage(user, MESSAGE_REMOVE_USER);
    return this.client.emit<void>('user_block', user.id).toPromise();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public help = async (user: User, _message: string): Promise<void> => {
    return this.sendMessage(user, MESSAGE_HELP);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public noThanks = async (user: User, _message: string): Promise<void> => {
    return this.sendMessage(user, MESSAGE_OK, this.clearKeyboard);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public id = async (user: User, _message: string): Promise<void> => {
    return this.sendMessage(user, String(user.id));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public list = async (user: User, _message: string): Promise<void> => {
    this.logger.log(`Отдаем список пользователю ${user.id}`);
    const subscriptions = await this.subscriptionService.findByUser(user);

    const opts = await this.sendPreviewAndGenerateKeyboard(user, MESSAGE_LIST_REMOVE, subscriptions);

    return this.sendMessage(user, MESSAGE_LIST_MESSAGE, opts);
  }

  public unsubscribe = async (user: User, serialName: string): Promise<void> => {
    this.logger.log(`Удаляет подписку на ${serialName} пользователя ${user.id}`);

    const subscription = await this.findSubscriptionBySerialName(user, serialName);
    const index = subscription.fans.findIndex((item) => item.user == user._id);
    if (index === -1) {
      throw new SwatcherBadRequestException(user, serialName);
    }

    subscription.fans.splice(index, 1);
    await subscription.save();

    return this.sendMessage(user, MESSAGE_UNSUBSCRIBE(serialName), this.clearKeyboard);
  }

  public subscribe = async (user: User, serialName: string): Promise<void> => {
    this.logger.log(`Добавляем подписку на сериал ${serialName} пользователю ${user.id}`);

    // check if user excided limit(free)
    if (user.payed === 0) {
      const subs = await this.subscriptionService.findByUser(user);
      if (subs.length > MAX_FREE_SERIALS) {
        this.logger.log(`Пользовтель ${user.id} израсходовал лимит подписок`);
        throw new SwatcherLimitExceedException(user, serialName);
      }
    }
  
    const subscription = await this.findSubscriptionBySerialName(user, serialName);
    const alreadySubscribed = subscription.fans.find((fan) => fan.user == user._id);
    if (!alreadySubscribed) {
      this.logger.log(`Подписали ${user.id} на ${serialName}`);
      subscription.fans.push({ user: user._id, voiceover: [] });
      await subscription.save();
    }

    /** TODO: create class for message opts */
    let opts: any;
    let answer: string;
    if (user.payed > 0) {
      const keyboard = [[]];

      subscription.serial.voiceover = subscription.serial.voiceover || [];

      for(const voiceover of subscription.serial.voiceover) {
        keyboard.push([`${MESSAGE_SUBS_VOICEOVER} ${voiceover}`]);
      }

      alreadySubscribed
        ? keyboard.push([MESSAGE_SUBS_ENOUTH])
        : keyboard.push([MESSAGE_SUBS_ALL]);

      opts = {
        reply_markup: JSON.stringify({
          keyboard: keyboard,
          one_time_keyboard: true,
          resize_keyboard: true
        })
      }

      this.createContext(user, subscription);

      answer = MESSAGE_SUBS_MESSAGE_PAYED;
    } else {
      answer = MESSAGE_SUBS_MESSAGE;
      opts = this.clearKeyboard;
    }

    return this.sendMessage(user, `${answer}  ${subscription.serial.name}`, opts);
  }
}
