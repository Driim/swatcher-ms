/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { SentryModule } from '@ntegral/nestjs-sentry';
import { LogLevel } from '@sentry/types';
import { Model } from 'mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  USER_COLLECTION,
  SERIAL_COLLECTION,
  CONTEXT_COLLECTION,
  SUBS_COLLECTION,
} from '../../app.constants';
import { UIModule } from './ui.module';
import { UIService } from './ui.service';
import { SerialService } from '../../domains/serial/serial.provider';
import { UserService } from '../../domains/user/user.provider';
import { User, Serial, SubscriptionPopulated } from '../../interfaces';
import { SwatcherNothingFoundException, SwatcherBadRequestException } from '../../exceptions';
import { SubscriptionService } from '../../domains/subscription/subscription.provider';
import {
  MESSAGE_FIND_ALL,
  MESSAGE_SUBS_MESSAGE,
  MESSAGE_SUBS_MESSAGE_PAYED,
  MESSAGE_SUBS_VOICEOVER,
  MESSAGE_SUBS_ALL,
  MESSAGE_SUBS_ENOUTH,
} from '../../app.strings';
import { ContextService } from '../../domains/context/context.provider';
import { ContextPopulated } from '../../interfaces/context.interface';
import { AnnounceDto } from '../../dto/announce.dto';

describe('Swatcher UI', () => {
  let uiService: UIService;
  let serialService: SerialService;
  let userService: UserService;
  let subscriptionService: SubscriptionService;
  let contextService: ContextService;

  let UserModel: Model<User>;
  let SerialModel: Model<Serial>;
  let ContexModel: Model<ContextPopulated>;
  let SubscriptionModel: Model<SubscriptionPopulated>;

  let defaultUser: User;
  let defaultSerial: Serial;
  const TESTING_NAME = 'Testing';

  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
          useFactory: () => ({
            uri: 'mongodb://localhost:27017/swatcher_test',
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
          }),
        }),
        SentryModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (cfg: ConfigService) => ({
            dsn: cfg.get('SENTRY_DSN'),
            debug: true,
            environment: 'development',
            release: null, // must create a release in sentry.io dashboard
            logLevel: LogLevel.Debug, // based on sentry.io loglevel //
          }),
          inject: [ConfigService],
        }),
        UIModule,
      ],
    }).compile();

    uiService = app.get<UIService>(UIService);
    serialService = app.get<SerialService>(SerialService);
    userService = app.get<UserService>(UserService);
    subscriptionService = app.get<SubscriptionService>(SubscriptionService);
    contextService = app.get<ContextService>(ContextService);

    UserModel = app.get<Model<User>>(getModelToken(USER_COLLECTION));
    SerialModel = app.get<Model<Serial>>(getModelToken(SERIAL_COLLECTION));
    ContexModel = app.get<Model<ContextPopulated>>(getModelToken(CONTEXT_COLLECTION));
    SubscriptionModel = app.get<Model<SubscriptionPopulated>>(getModelToken(SUBS_COLLECTION));
  });

  beforeEach(async () => {
    defaultUser = await userService.create(1, 'user');

    defaultSerial = new SerialModel();
    defaultSerial.name = TESTING_NAME;
    defaultSerial.alias = ['Alias'];
    defaultSerial.country = ['Russia'];
    defaultSerial.director = [];
    defaultSerial.genre = [];
    defaultSerial.voiceover = [];
    defaultSerial.season = [];
    defaultSerial = await defaultSerial.save();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await SubscriptionModel.deleteMany({});
    await UserModel.deleteMany({});
    await SerialModel.deleteMany({});
  });

  afterAll(async () => {
    /** cleanup and exit */
    return app.close();
  });

  describe('find serial', () => {
    it('should throw error if nothing was found', async () => {
      jest.spyOn(serialService, 'find').mockResolvedValue([]);
      await expect(uiService.find(defaultUser, 'test message')).rejects.toThrowError(
        SwatcherNothingFoundException,
      );
    });

    // TODO: this test
    xit('should return only MAX_SEARCH_COUNT if found more', async () => {
      // check that serials sorted by fans count
    });

    it('should return serial that was found', async () => {
      // adding subscription to create subscription for serial;
      await subscriptionService.addSubscription(defaultUser, defaultSerial);

      jest.spyOn(uiService, 'sendMessage').mockResolvedValue();
      const mock = jest.spyOn(uiService, 'sendSerialPreview').mockResolvedValue();

      await uiService.find(defaultUser, TESTING_NAME);

      // removing subscription
      await subscriptionService.removeSubscription(defaultUser, defaultSerial);

      const opts = {
        keyboard: [['Добавить Testing'], ['Нет, не надо']],
        oneTimeKeyboard: true,
        resizeKeyboard: true,
      };

      expect(uiService.sendMessage).toBeCalledWith(defaultUser, MESSAGE_FIND_ALL, opts);
      const serial = mock.mock.calls[0][1];
      expect(serial.name).toBe(TESTING_NAME);
    });
  });

  describe('unsubscribe user', () => {
    it('should throw error if serial not found', async () => {
      jest.spyOn(serialService, 'findExact').mockResolvedValue(null);

      await expect(uiService.unsubscribe(defaultUser, TESTING_NAME)).rejects.toThrowError(
        SwatcherNothingFoundException,
      );
    });
  });

  describe('subscribe user', () => {
    it("should throw error if can't find exact match", async () => {
      jest.spyOn(serialService, 'findExact').mockResolvedValue(null);

      await expect(uiService.subscribe(defaultUser, TESTING_NAME)).rejects.toThrowError(
        SwatcherNothingFoundException,
      );
    });

    it('should send simple message for basic user', async () => {
      jest.spyOn(uiService, 'sendMessage').mockResolvedValue();
      jest.spyOn(contextService, 'createContext').mockResolvedValue();

      await uiService.subscribe(defaultUser, TESTING_NAME);

      expect(contextService.createContext).not.toBeCalled();
      expect(uiService.sendMessage).toBeCalledWith(
        defaultUser,
        `${MESSAGE_SUBS_MESSAGE} ${TESTING_NAME}`,
        {
          keyboard: [],
          removeKeyboard: true,
        },
      );
    });

    it('should send message with keyboard to payed user', async () => {
      jest.spyOn(contextService, 'createContext').mockResolvedValue();
      const mock = jest.spyOn(uiService, 'sendMessage').mockResolvedValue();

      const user = await userService.create(2, 'test');
      user.payed = 1;
      await user.save();

      defaultSerial.voiceover = ['one', 'two'];
      await defaultSerial.save();

      await uiService.subscribe(user, TESTING_NAME);

      expect(contextService.createContext).toBeCalled();
      const args = mock.mock.calls[0];
      expect(args[0].username).toBe(user.username);
      expect(args[1]).toBe(`${MESSAGE_SUBS_MESSAGE_PAYED} ${TESTING_NAME}`);

      const opts = {
        keyboard: [
          [`${MESSAGE_SUBS_VOICEOVER} one`],
          [`${MESSAGE_SUBS_VOICEOVER} two`],
          [MESSAGE_SUBS_ALL],
          [MESSAGE_SUBS_ENOUTH],
        ],
        oneTimeKeyboard: true,
        resizeKeyboard: true,
      };
      expect(args[2]).toStrictEqual(opts);
    });
  });

  describe('add voiceover', () => {
    it('should throw error if no context', async () => {
      jest.spyOn(contextService, 'getContext').mockResolvedValue(null);
      await expect(uiService.addVoiceover(defaultUser, 'one')).rejects.toThrowError(
        SwatcherBadRequestException,
      );
    });

    it('should throw error if fan not subscribed', async () => {
      const user = await userService.create(2, 'user');
      const subs = await subscriptionService.addSubscription(user, defaultSerial);
      const context = new ContexModel();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      context.user = defaultUser._id; /** wrong user */
      context.subscription = subs;

      jest.spyOn(contextService, 'getContext').mockResolvedValue(context);

      await expect(uiService.addVoiceover(defaultUser, 'one')).rejects.toThrowError(
        SwatcherBadRequestException,
      );
    });

    it('should not add voiceover subs if already', async () => {
      const sendMessage = jest.spyOn(uiService, 'sendMessage').mockResolvedValue();

      const user = await userService.create(2, 'test');
      user.payed = 1;
      await user.save();

      defaultSerial.voiceover = ['one', 'two', 'three'];
      await defaultSerial.save();

      await uiService.subscribe(user, TESTING_NAME);
      let [subs] = await subscriptionService.findByUser(user);
      subs.fans[0].voiceover = ['one'];
      await subs.save();

      await uiService.addVoiceover(user, 'one'); /** same voiceover */

      [subs] = await subscriptionService.findByUser(user);
      expect(subs.fans.length).toBe(1);

      const resultingOpts = sendMessage.mock.calls[1][2];
      const opts = {
        keyboard: [
          [`${MESSAGE_SUBS_VOICEOVER} two`],
          [`${MESSAGE_SUBS_VOICEOVER} three`],
          [MESSAGE_SUBS_ALL],
          [MESSAGE_SUBS_ENOUTH],
        ],
        oneTimeKeyboard: true,
        resizeKeyboard: true,
      };

      expect(resultingOpts).toStrictEqual(opts);
    });

    it('should add subs to voiceover', async () => {
      jest.spyOn(uiService, 'sendMessage').mockResolvedValue();

      const user = await userService.create(2, 'test');
      user.payed = 1;
      await user.save();

      defaultSerial.voiceover = ['one', 'two', 'three'];
      await defaultSerial.save();
      await uiService.subscribe(user, TESTING_NAME);

      await uiService.addVoiceover(user, 'one');

      const [subs] = await subscriptionService.findByUser(user);
      expect(subs.fans.length).toBe(1);
      expect(subs.fans[0].voiceover.length).toBe(1);
    });
  });

  describe('clear voiceovers', () => {
    it('should throw error if no context', async () => {
      jest.spyOn(contextService, 'getContext').mockResolvedValue(null);

      await expect(uiService.clearVoiceovers(defaultUser, '')).rejects.toThrowError(
        SwatcherBadRequestException,
      );
    });

    it('should throw error if no fan', async () => {
      const user = await userService.create(2, 'user');
      const subs = await subscriptionService.addSubscription(user, defaultSerial);
      const context = new ContexModel();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      context.user = defaultUser._id; /** wrong user */
      context.subscription = subs;

      jest.spyOn(contextService, 'getContext').mockResolvedValue(context);

      await expect(uiService.clearVoiceovers(defaultUser, '')).rejects.toThrowError(
        SwatcherBadRequestException,
      );
    });

    it('should clear user voiceover subscription', async () => {
      jest.spyOn(uiService, 'sendMessage').mockResolvedValue();

      const user = await userService.create(2, 'test');
      user.payed = 1;
      await user.save();

      defaultSerial.voiceover = ['one', 'two', 'three'];
      await defaultSerial.save();
      await uiService.subscribe(user, TESTING_NAME);
      await uiService.addVoiceover(user, 'one');

      await uiService.clearVoiceovers(user, undefined);

      const [subs] = await subscriptionService.findByUser(user);
      expect(subs.fans.length).toBe(1);
      expect(subs.fans[0].voiceover.length).toBe(0);
    });
  });

  describe('received announce', () => {
    let defaultDto: AnnounceDto;

    beforeEach(() => {
      defaultDto = new AnnounceDto();
      defaultDto.id = String(defaultSerial._id);
      defaultDto.name = TESTING_NAME;
      defaultDto.season = '1 сезон';
      defaultDto.series = '1 серия';
    });

    it('should not send message if their no subscribers', async () => {
      jest.spyOn(uiService, 'sendMessage').mockResolvedValue();

      await uiService.subscribe(defaultUser, TESTING_NAME);
      await uiService.unsubscribe(defaultUser, TESTING_NAME);

      await uiService.receivedAnnounce(defaultDto);

      /** one time subscribe, one time unsubscribe */
      expect(uiService.sendMessage).toBeCalledTimes(2);
    });

    it('should not send message if user not subscribed to this voiceover', async () => {
      jest.spyOn(uiService, 'sendMessage').mockResolvedValue();

      defaultUser.payed = 1;
      await defaultUser.save();

      await uiService.subscribe(defaultUser, TESTING_NAME);
      await uiService.addVoiceover(defaultUser, 'lostfilm');
      await uiService.enouthVoiceovers(defaultUser, '');

      defaultDto.voiceover = 'coldfilm';

      await uiService.receivedAnnounce(defaultDto);

      /** 3 not 4 */
      expect(uiService.sendMessage).toBeCalledTimes(3);
    });

    it('should send message to subscribed for this voiceover user', async () => {
      const mock = jest.spyOn(uiService, 'sendMessage').mockResolvedValue();

      defaultUser.payed = 1;
      await defaultUser.save();

      await uiService.subscribe(defaultUser, TESTING_NAME);
      await uiService.addVoiceover(defaultUser, 'lostfilm');
      await uiService.enouthVoiceovers(defaultUser, '');

      defaultDto.voiceover = 'lostfilm';
      await uiService.receivedAnnounce(defaultDto);

      expect(mock.mock.calls[3][1]).toMatch(`1 серия 1 сезона ${TESTING_NAME} в озвучке lostfilm`);
    });

    it('should send message to user subscribed to all voiceovers', async () => {
      const mock = jest.spyOn(uiService, 'sendMessage').mockResolvedValue();

      await uiService.subscribe(defaultUser, TESTING_NAME);

      defaultDto.voiceover = 'lostfilm';

      await uiService.receivedAnnounce(defaultDto);

      expect(mock.mock.calls[1][1]).toMatch(`1 серия 1 сезона ${TESTING_NAME} в озвучке lostfilm`);
    });
  });
});
