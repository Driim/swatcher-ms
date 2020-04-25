import { Test, TestingModule } from '@nestjs/testing';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TRANSPORT_SERVICE, SubsName, SerialName } from '../app.constants';
import { Serial } from '../interfaces/serial.interface';
import { SubscriptionService } from './subscription.provider';
import { Subscription } from '../interfaces/subscription.interface';
import { SerialService } from '../serial/serial.provider';
import { SubscriptionModule } from './subscription.module';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { SerialModule } from '../serial/serial.module';
import { Model } from 'mongoose';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.provider';
import { User } from '../interfaces';

describe('Serial Service', () => {
  let subsService: SubscriptionService;
  let serialService: SerialService;
  let subscriptionModel: Model<Subscription>;
  let serialModel: Model<Serial>;
  let serial: Serial;
  let userService: UserService;

  const TESTING_NAME = 'Testing';

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        ClientsModule.register([
          {
            name: TRANSPORT_SERVICE,
            transport: Transport.REDIS,
            options: { url: 'redis://localhost:6379' },
          },
        ]),
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
        UserModule
      ],
    }).compile();

    subsService = app.get<SubscriptionService>(SubscriptionService);
    serialService = app.get<SerialService>(SerialService);
    subscriptionModel = app.get<Model<Subscription>>(getModelToken(SubsName));
    serialModel = app.get<Model<Serial>>(getModelToken(SerialName));
    userService = app.get<UserService>(UserService);

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

  describe('findBySerials', () => {
    beforeEach(async () => {
      const subscription = new subscriptionModel();
      subscription.serial = serial._id;
      await subscription.save();
    });

    it('should find subscriptions', async () => {
      const serials = await serialService.find(TESTING_NAME);
      const subs = await subsService.findBySerials(serials);

      expect(subs.length).toBe(1);
      expect(subs[0].serial.name).toBe(TESTING_NAME);
    });
  });

  describe('findByUser', () => {
    let user: User;
    beforeEach(async () => {
      user = await userService.create(1, 'user');
      const subscription = new subscriptionModel();
      subscription.serial = serial._id;
      subscription.fans.push({
        user: user._id,
        voiceover: []
      });
  
      await subscription.save();
    });

    it('should find subscriptions', async () => {
      const subs = await subsService.findByUser(user);

      expect(subs.length).toBe(1);
      expect(subs[0].fans[0].user).toStrictEqual(user._id);
    });
  });

  afterEach(async () => {
    await subscriptionModel.remove({}).exec();
  });

  afterAll(async () => {
    await serialModel.remove({}).exec();
  });
});
