/* eslint-env node, jest */
import { Model, Types } from 'mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { SUBS_COLLECTION, SERIAL_COLLECTION, USER_COLLECTION } from '../app.constants';
import { Serial } from '../interfaces/serial.interface';
import { SubscriptionService } from './subscription.provider';
import { Subscription, SubscriptionPopulated } from '../interfaces/subscription.interface';
import { SerialService } from '../serial/serial.provider';
import { SubscriptionModule } from './subscription.module';
import { SerialModule } from '../serial/serial.module';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.provider';
import { SwatcherLimitExceedException, SwatcherBadRequestException } from '../exceptions';
import { User } from '../interfaces';
import { ConfigModule } from '@nestjs/config';

describe('Serial Service', () => {
  let subsService: SubscriptionService;
  let serialService: SerialService;
  let subscriptionModel: Model<Subscription>;
  let subscriptionPopulatedModel: Model<SubscriptionPopulated>;
  let serialModel: Model<Serial>;
  let userModel: Model<User>;
  let serial: Serial;
  let userService: UserService;

  const TESTING_NAME = 'Testing';

  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
          useFactory: async () => ({
            uri: 'mongodb://localhost:27017/swatcher_test',
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
          }),
        }),
        SerialModule,
        SubscriptionModule,
        UserModule,
      ],
    }).compile();

    subsService = app.get<SubscriptionService>(SubscriptionService);
    serialService = app.get<SerialService>(SerialService);
    subscriptionModel = app.get<Model<Subscription>>(getModelToken(SUBS_COLLECTION));
    subscriptionPopulatedModel = app.get<Model<SubscriptionPopulated>>(getModelToken(SUBS_COLLECTION));
    serialModel = app.get<Model<Serial>>(getModelToken(SERIAL_COLLECTION));
    userService = app.get<UserService>(UserService);
    userModel = app.get<Model<User>>(getModelToken(USER_COLLECTION));

    serial = new serialModel();
    serial.name = TESTING_NAME;
    serial.alias = ['Alias'];
    serial.country = ['Russia'];
    serial.director = [];
    serial.genre = [];
    serial.voiceover = [];
    serial.season = [];
    await serial.save();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await userModel.deleteMany({}).exec();
    await subscriptionModel.deleteMany({}).exec();
  });

  afterAll(async () => {
    await serialModel.deleteMany({}).exec();
    app.close();
  });

  describe('findBySerials', () => {
    it('should find subscriptions', async () => {
      const subscription = new subscriptionModel();
      subscription.serial = new Types.ObjectId(String(serial._id));
      await subscription.save();

      const serials = await serialService.find(TESTING_NAME);
      const subs = await subsService.findBySerials(serials);

      expect(subs.length).toBe(1);
      expect(subs[0].serial.name).toBe(TESTING_NAME);
    });
  });

  describe('findByUser', () => {
    it('should find subscriptions', async () => {
      const user = await userService.create(1, 'user');
      const subscription = new subscriptionModel();
      subscription.serial = new Types.ObjectId(String(serial._id));
      subscription.fans.push({
        user: user._id,
        voiceover: [],
      });

      await subscription.save();

      const subs = await subsService.findByUser(user);

      expect(subs.length).toBe(1);
      expect(subs[0].fans[0].user).toStrictEqual(user._id);
    });
  });

  describe('addSubscription', () => {
    let user;
    beforeEach(async () => {
      user = await userService.create(1, 'user');
    });

    it('should throw error if user exceed limit', async () => {
      const subs = new subscriptionPopulatedModel();
      jest.spyOn(subsService, 'findByUser').mockResolvedValue([subs, subs, subs]);

      await expect(subsService.addSubscription(user, serial)).rejects.toThrowError(
        SwatcherLimitExceedException,
      );
    });

    it('should create subscription', async () => {
      const subs = await subsService.addSubscription(user, serial);

      expect(subs).toBeDefined();
      expect(subs.fans.length).toBe(1);
    });

    it('should add user to exsisting subscription', async () => {
      const firstUser = await userService.create(1, 'user');
      const secondUser = await userService.create(2, 'test');

      await subsService.addSubscription(firstUser, serial);
      const subs = await subsService.addSubscription(secondUser, serial);

      expect(subs.fans.length).toBe(2);
      const check = await subsService.findBySerials([serial]);
      expect(check.length).toBe(1);
    });

    it('should not add user if it already subscribed', async () => {
      await subsService.addSubscription(user, serial);

      const subs = await subsService.addSubscription(user, serial);

      expect(subs.fans.length).toBe(1);
    });
  });

  describe('removeSubscription', () => {
    let user;
    beforeEach(async () => {
      user = await userService.create(1, 'user');
    });

    it('should throw error if there no subsriptions for serial', async () => {
      await expect(subsService.removeSubscription(user, serial)).rejects.toThrowError(
        SwatcherBadRequestException,
      );
    });

    it('should throw error if fan not subsribed', async () => {
      const test = await userService.create(2, 'test');
      await subsService.addSubscription(user, serial);

      await expect(subsService.removeSubscription(test, serial)).rejects.toThrowError(
        SwatcherBadRequestException,
      );
    });

    it('should remove subsription', async () => {
      await subsService.addSubscription(user, serial);
      await subsService.removeSubscription(user, serial);

      const subs = await subsService.findBySerials([serial]);
      expect(subs.length).toBe(1);
      expect(subs[0].fans.length).toBe(0);
    });
  });

  describe('get subscribers', () => {
    it('should return empty array if no subscribers', async () => {
      const fans = await subsService.getSubscribers(String(serial._id));

      expect(Array.isArray(fans)).toBeTruthy();
      expect(fans.length).toBe(0);
    });

    it('should return array with populated users', async () => {
      const user = await userService.create(2, 'test');
      const subs = await subsService.addSubscription(user, serial);

      const fans = await subsService.getSubscribers(String(serial._id));

      expect(Array.isArray(fans)).toBeTruthy();
      expect(fans.length).toBe(1);
      expect((fans[0].user as User).id).toBe(user.id);
    });
  });
});
