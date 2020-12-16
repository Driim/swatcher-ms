import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { User } from '../../interfaces/user.interface';
import {
  TRANSPORT_SERVICE,
  COMMAND_HELP,
  COMMAND_ID,
  COMMAND_NOT_THAT,
  COMMAND_NO_THANKS,
  MAX_SEARCH_COUNT,
  COMMAND_LIST,
  COMMAND_UNSUBSCRIBE,
  COMMAND_STOP,
  COMMAND_SUBSCRIBE,
  COMMAND_VOICEOVER,
  COMMAND_ENOUTH_VOICEOVERS,
  COMMAND_ANY_VOICEOVER,
} from '../../app.constants';
import { MessageHander } from '../../interfaces/message-handler.interface';
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
  MESSAGE_SUBS_ALL,
  MESSAGE_SUBS_MESSAGE_PAYED,
  MESSAGE_SUBS_ENOUTH,
  MESSAGE_VOICE_ADD,
  MESSAGE_SEND_VOICEOVERS,
} from '../../app.strings';
import { Serial } from '../../interfaces/serial.interface';
import { SwatcherNothingFoundException, SwatcherBadRequestException } from '../../exceptions';
import { SubscriptionService } from '../../domains/subscription/subscription.provider';
import { SerialService } from '../../domains/serial/serial.provider';
import { FanInterface } from '../../interfaces';
import { ContextService } from '../../domains/context/context.provider';
import { UserService } from '../../domains/user/user.provider';
import { AnnounceDto } from '../../dto/announce.dto';

@Injectable()
export class UIService {
  private readonly logger = new Logger(UIService.name);

  private handlers: MessageHander[];

  private clearKeyboard = {
    keyboard: [],
    removeKeyboard: true,
  };

  constructor(
    @Inject(TRANSPORT_SERVICE)
    private readonly client: ClientProxy,
    private readonly subscriptionService: SubscriptionService,
    private readonly serialService: SerialService,
    private readonly contextService: ContextService,
    private readonly userService: UserService,
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
      },
      {
        handle: this.subscribe,
        regexp: COMMAND_SUBSCRIBE,
      },
      {
        handle: this.addVoiceover,
        regexp: COMMAND_VOICEOVER,
      },
      {
        handle: this.enouthVoiceovers,
        regexp: COMMAND_ENOUTH_VOICEOVERS,
      },
      {
        handle: this.clearVoiceovers,
        regexp: COMMAND_ANY_VOICEOVER,
      },
    ];
  }

  public getHandlers(): MessageHander[] {
    return this.handlers;
  }

  public async sendSerialPreview(user: User, serial: Serial, fan?: FanInterface): Promise<void> {
    let message = `${serial.name} \n`;
    message += `${MESSAGE_SEND_ALIAS}: ${serial.alias.join(', ')} \n`;
    message += `${MESSAGE_SEND_COUNTRY}: ${serial.country.join(', ')} \n`;
    message += `${MESSAGE_SEND_GENRE}: ${serial.genre.join(', ')} \n`;
    message += `${MESSAGE_SEND_SEASONS}: ${serial.season.length} \n`;

    if (fan && fan.voiceover.length) {
      message += `${MESSAGE_SEND_VOICEOVERS}: ${fan.voiceover.join()} \n`;
    }

    const { img } = serial.season.reduce((a, b) =>
      parseInt(a.name, 10) > parseInt(b.name, 10) ? a : b,
    );

    const opts = {
      caption: message,
    };

    return this.client
      .emit<void>('send_photo', { user: user.id, message: img, opts })
      .toPromise();
  }

  public async sendMessage(user: User, message: string, opts?: unknown): Promise<void> {
    return this.client
      .emit<void>('send_message', { user: user.id, message, opts })
      .toPromise();
  }

  public async find(user: User, message: string): Promise<void> {
    if (!message) {
      throw new SwatcherBadRequestException(user, message);
    }

    const serials = await this.serialService.find(message);
    if (serials.length === 0) {
      throw new SwatcherNothingFoundException(user, message);
    }

    this.logger.log(`Ищем ${message} для пользователя ${user.id}`);

    let subscriptions = await this.subscriptionService.findBySerials(serials);
    const originalLength = subscriptions.length;
    subscriptions.sort((a, b) => b.fans.length - a.fans.length);
    subscriptions = subscriptions.slice(0, MAX_SEARCH_COUNT);

    const keyboard = [];

    for (const subs of subscriptions) {
      await this.sendSerialPreview(user, subs.serial);
      keyboard.push([`${MESSAGE_ADD_SERIAL} ${subs.serial.name}`]);
    }

    keyboard.push([MESSAGE_NO_THANKS]);

    const opts = {
      keyboard,
      oneTimeKeyboard: true,
      resizeKeyboard: true,
    };

    return originalLength === subscriptions.length
      ? this.sendMessage(user, MESSAGE_FIND_ALL, opts)
      : this.sendMessage(user, MESSAGE_FIND_EXT(serials.length), opts);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public remove = async (user: User, _message: string): Promise<void> => {
    this.logger.log(`Удаляем пользователя ${user.id}`);
    await this.userService.block(user.id);
    return this.sendMessage(user, MESSAGE_REMOVE_USER);
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

    const keyboard = [];

    for (const subs of subscriptions) {
      const fan = SubscriptionService.findFan(user, subs);
      await this.sendSerialPreview(user, subs.serial, fan);
      keyboard.push([`${MESSAGE_LIST_REMOVE} ${subs.serial.name}`]);
    }

    keyboard.push([MESSAGE_NO_THANKS]);

    const opts = {
      keyboard,
      oneTimeKeyboard: true,
      resizeKeyboard: true,
    };

    return this.sendMessage(user, MESSAGE_LIST_MESSAGE, opts);
  };

  public unsubscribe = async (user: User, serialName: string): Promise<void> => {
    if (!serialName) {
      throw new SwatcherBadRequestException(user, 'empty serial name');
    }

    const serial = await this.serialService.findExact(serialName);
    if (!serial) {
      throw new SwatcherNothingFoundException(user, serialName);
    }

    this.logger.log(`Удаляет подписку на ${serialName} пользователя ${user.id}`);

    await this.subscriptionService.removeSubscription(user, serial);
    return this.sendMessage(user, MESSAGE_UNSUBSCRIBE(serialName), this.clearKeyboard);
  };

  public subscribe = async (user: User, serialName: string): Promise<void> => {
    if (!serialName) {
      throw new SwatcherBadRequestException(user, 'empty serial name');
    }

    const serial = await this.serialService.findExact(serialName);
    if (!serial) {
      throw new SwatcherNothingFoundException(user, serialName);
    }

    this.logger.log(`Добавляем подписку на сериал ${serialName} пользователю ${user.id}`);
    const subscription = await this.subscriptionService.addSubscription(user, serial);

    /** TODO: create class for message opts */
    let opts: any;
    let answer: string;
    if (user.payed > 0) {
      const keyboard = [];

      subscription.serial.voiceover = subscription.serial.voiceover || [];

      /** user can already be subscribed */
      const fan = SubscriptionService.findFan(user, subscription);
      let voiceovers = subscription.serial.voiceover;

      if (fan) {
        /** filter voiceovers user already subscribed */
        voiceovers = subscription.serial.voiceover.filter(
          (voice) => !fan.voiceover.includes(voice),
        );
      }

      for (const voiceover of voiceovers) {
        keyboard.push([`${MESSAGE_SUBS_VOICEOVER} ${voiceover}`]);
      }

      keyboard.push([MESSAGE_SUBS_ALL]);
      keyboard.push([MESSAGE_SUBS_ENOUTH]);

      opts = {
        keyboard,
        oneTimeKeyboard: true,
        resizeKeyboard: true,
      };

      await this.contextService.createContext(user, subscription);

      answer = MESSAGE_SUBS_MESSAGE_PAYED;
    } else {
      answer = MESSAGE_SUBS_MESSAGE;
      opts = this.clearKeyboard;
    }

    return this.sendMessage(user, `${answer} ${subscription.serial.name}`, opts);
  };

  public addVoiceover = async (user: User, voiceover: string): Promise<void> => {
    const context = await this.contextService.getContext(user);
    if (!context) {
      throw new SwatcherBadRequestException(user, voiceover);
    }

    if (!voiceover) {
      throw new SwatcherBadRequestException(user, 'empty voiceover');
    }

    const { subscription } = context;
    const fan = SubscriptionService.findFan(user, subscription);
    if (!fan) {
      throw new SwatcherBadRequestException(user, voiceover);
    }

    const index = fan.voiceover.findIndex((value) => value === voiceover);
    if (index === -1) {
      fan.voiceover.push(voiceover);
    }

    const { serial } = subscription;
    this.logger.log(
      `Добавляем озвучку ${voiceover} на сериал ${serial.name} пользователю ${user.id}`,
    );

    await subscription.save();

    const diff = subscription.serial.voiceover.filter((voice) => !fan.voiceover.includes(voice));

    const keyboard = [];
    for (const vo of diff) {
      keyboard.push([`${MESSAGE_SUBS_VOICEOVER} ${vo}`]);
    }

    keyboard.push([MESSAGE_SUBS_ALL]);
    keyboard.push([MESSAGE_SUBS_ENOUTH]);

    const opts = {
      keyboard,
      oneTimeKeyboard: true,
      resizeKeyboard: true,
    };

    return this.sendMessage(user, `${MESSAGE_VOICE_ADD} ${voiceover}`, opts);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public enouthVoiceovers = async (user: User, _message: string): Promise<void> => {
    await this.contextService.clearContext(user);
    return this.sendMessage(user, MESSAGE_OK, this.clearKeyboard);
  };

  public clearVoiceovers = async (user: User, _message: string): Promise<void> => {
    const context = await this.contextService.getContext(user);
    if (!context) {
      throw new SwatcherBadRequestException(user, _message);
    }

    const fan = SubscriptionService.findFan(user, context.subscription);
    if (!fan) {
      throw new SwatcherBadRequestException(user, _message);
    }

    const { serial } = context.subscription;
    this.logger.log(`Очищаем подписку на озвучки пользователю ${user.id} на сериал ${serial.name}`);

    fan.voiceover = [];
    await context.subscription.save();

    return this.sendMessage(user, MESSAGE_OK, this.clearKeyboard);
  };

  async receivedAnnounce(data: AnnounceDto): Promise<void> {
    // console.log(data);
    let fans = await this.subscriptionService.getSubscribers(data.id);

    fans = fans.filter((fan) => {
      if (fan.voiceover.length === 0) {
        // all voiceovers
        return true;
      }

      // TODO: make lowercase all voiceovers
      return !!fan.voiceover.includes(data.voiceover);
    });

    // send messages
    const reg = /(субтитры)/i;
    let message = `${data.series} ${data.season}а ${data.name} `;

    if (data.voiceover !== undefined && data.voiceover !== '') {
      if (reg.exec(data.voiceover)) {
        message += 'с субтитрами';
      } else {
        message += `в озвучке ${data.voiceover}`;
      }
    }

    message += '\n';

    for (const fan of fans) {
      await this.sendMessage(fan.user as User, message, this.clearKeyboard);
    }
  }
}
