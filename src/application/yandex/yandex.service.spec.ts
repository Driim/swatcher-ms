import { Model } from 'mongoose';
import { TestingModule, Test } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { SentryModule } from '@ntegral/nestjs-sentry';
import { LogLevel } from '@sentry/types';
import { YandexService, YandexOperation } from './yandex.service';
import { Payer, User } from '../../interfaces';
import { UserService } from '../../domains/user';
import { YandexModule } from './yandex.module';
import { PAYER_COLLECTION } from '../../app.constants';

describe('Yandex Money Service', () => {
  let service: YandexService;
  let userService: UserService;
  let model: Model<Payer>;
  let config: ConfigService;
  let payer: Payer;
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
        SentryModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: async (cfg: ConfigService) => ({
            dsn: cfg.get('SENTRY_DSN'),
            debug: true,
            environment: 'development',
            release: null, // must create a release in sentry.io dashboard
            logLevel: LogLevel.Debug, //based on sentry.io loglevel //
          }),
          inject: [ConfigService],
        }),
        YandexModule,
      ],
    }).compile();

    service = app.get<YandexService>(YandexService);
    config = app.get<ConfigService>(ConfigService);
    model = app.get<Model<Payer>>(getModelToken(PAYER_COLLECTION));
    userService = app.get<UserService>(UserService);
    payer = new model();
  });

  beforeEach(() => {
    jest.spyOn(model, 'findOne').mockResolvedValue(undefined);
    jest.spyOn(userService, 'setPayed').mockResolvedValue();
    jest.spyOn(payer, 'save').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    /** cleanup and exit */
    await app.close();
  });

  describe('handle operations function', () => {
    it('should handle empty array', async () => {
      jest.spyOn(userService, 'find').mockResolvedValue(undefined);

      const operations: YandexOperation[] = [];
      await service.handleOperations(operations);

      expect(userService.find).not.toBeCalled();
    });

    xit('should not handle incorrect operations', async () => {
      jest.spyOn(userService, 'find').mockResolvedValue(undefined);

      const premiumCost = config.get<number>('PREMIUM_COST');
      const operations: YandexOperation[] = [
        {
          amount: premiumCost - 1,
          status: 'success',
          message: '1',
        } as YandexOperation,
        {
          amount: premiumCost,
          status: 'failed',
          message: '1',
        } as YandexOperation,
        {
          amount: premiumCost,
          status: 'success',
          message: 'hi',
        } as YandexOperation,
      ];

      await service.handleOperations(operations);

      expect(userService.find).not.toBeCalled();
    });

    it('should not do anything if user doesnt exists', async () => {
      jest.spyOn(userService, 'find').mockResolvedValue(undefined);
      jest.spyOn(model, 'findOne').mockResolvedValue({} as Payer);

      const premiumCost = config.get<number>('PREMIUM_COST');
      const operations: YandexOperation[] = [
        {
          amount: premiumCost,
          status: 'success',
          message: '1',
        } as YandexOperation,
      ];

      await service.handleOperations(operations);

      expect(userService.find).toBeCalled();
      expect(model.findOne).not.toBeCalled();
    });

    it('should stop handling if operations already handled', async () => {
      jest.spyOn(userService, 'find').mockResolvedValue({} as User);
      jest.spyOn(userService, 'setPayed').mockResolvedValue();
      jest.spyOn(model, 'findOne').mockResolvedValue({} as Payer);

      const premiumCost = config.get<number>('PREMIUM_COST');
      const operations: YandexOperation[] = [
        {
          amount: premiumCost,
          status: 'success',
          message: '1',
        } as YandexOperation,
      ];

      await service.handleOperations(operations);

      expect(userService.find).toBeCalled();
      expect(model.findOne).toBeCalled();
      expect(userService.setPayed).not.toBeCalled();
    });

    it('should set user payed status and save operation', async () => {
      /** TODO: */
    });
  });
});
