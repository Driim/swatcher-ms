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

describe('Serial Service', () => {
  let subsService: SubscriptionService;
  let serialService: SerialService;
  let subscriptionModel: Model<Subscription>;
  let serialModel: Model<Serial>;

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
            connectionFactory: (connection: any) => {
              // eslint-disable-next-line @typescript-eslint/no-var-requires
              connection.plugin(require('mongoose-autopopulate'));
              return connection;
            },
          }),
        }),
        SerialModule,
        SubscriptionModule,
      ],
    }).compile();

    subsService = app.get<SubscriptionService>(SubscriptionService);
    serialService = app.get<SerialService>(SerialService);
    subscriptionModel = app.get<Model<Subscription>>(getModelToken(SubsName));
    serialModel = app.get<Model<Serial>>(getModelToken(SerialName));

    const serial = new serialModel();
    serial.name = TESTING_NAME;
    serial.alias = ['Alias'];
    serial.country = ['Russia'];
    serial.director = [];
    serial.genre = [];
    serial.voiceover = [];
    serial.season = [];
    await serial.save();

    const subscription = new subscriptionModel();
    subscription.serial = serial._id;
    await subscription.save();
  });

  describe('findBySerials', () => {
    it('should find subscriptions', async () => {
      const serials = await serialService.find(TESTING_NAME);
      console.log(serials[0]);
      const subs = await subsService.findBySerials([serials[0]]);

      console.log('!!!!!!!!!!!!!!!!!!!');
      console.log(subs);
      console.log('!!!!!!!!!!!!!!!!!!!');
      expect(subs.length).toBe(1);
      // expect(subs[0].serial.name).toBe(TESTING_NAME);
    });
  });

  afterAll(async () => {
    // await subscriptionModel.remove({}).exec();
    // await serialModel.remove({}).exec();
  });
});
