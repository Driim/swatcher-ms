import { Test, TestingModule } from '@nestjs/testing';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SerialService } from './serial.provider';
import { TRANSPORT_SERVICE, SERIAL_COLLECTION } from '../../app.constants';
import { Serial } from '../../interfaces/serial.interface';
import { SerialModule } from './serial.module';

const TESTING_NAME = 'Testing';

describe('Serial Service', () => {
  let service: SerialService;
  let SerialModel: Model<Serial>;
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [
        ClientsModule.register([
          {
            name: TRANSPORT_SERVICE,
            transport: Transport.REDIS,
            options: { url: 'redis://localhost:6379' },
          },
        ]),
        MongooseModule.forRootAsync({
          useFactory: () => ({
            uri: 'mongodb://localhost:27017/swatcher_test',
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
          }),
        }),
        SerialModule,
      ],
    }).compile();

    service = app.get<SerialService>(SerialService);
    SerialModel = app.get<Model<Serial>>(getModelToken(SERIAL_COLLECTION));

    const serial = new SerialModel();
    serial.name = TESTING_NAME;
    serial.alias = ['Alias'];
    serial.country = ['Russia'];
    serial.director = [];
    serial.genre = [];
    serial.voiceover = [];
    serial.season = [];
    await serial.save();
  });

  describe('find', () => {
    it('should first use exact search', async () => {
      const result = await service.find(TESTING_NAME);

      expect(result.length).toBe(1);
    });

    it("should return empty array if fuse not init and exact match doesn't find anything", async () => {
      const result = await service.find('Test');

      expect(result.length).toBe(0);
    });

    it('should use fuzzy search', async () => {
      await service.updateIndex();

      const result = await service.find('Miracle');

      expect(result.length).toBe(1);
      expect(result[0].name).toBe(TESTING_NAME);
    });
  });

  afterAll(async () => {
    await SerialModel.deleteMany({}).exec();
    return app.close();
  });
});
