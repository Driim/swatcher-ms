import { Test, TestingModule } from '@nestjs/testing';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Repository, ObjectID } from 'typeorm';
import { SerialService } from './serial.provider';
import { TRANSPORT_SERVICE } from '../app.constants';
import { Serial } from '../interfaces/serial.interface';
import { SerialDto } from '../dto/serial.dto';
import { DuplicateSerialException } from '../exceptions/duplicate-serial.exception';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { SerialModule } from './serial.module';
import { Model } from 'mongoose';

const TESTING_NAME = 'Testing';

describe('Serial Service', () => {
  let service: SerialService;
  let model: Model<Serial>;

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
      ],
    }).compile();

    service = app.get<SerialService>(SerialService);
    model = app.get<Model<Serial>>(getModelToken('Serial'));

    const serial = new model();
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

      const result = await service.find('Test');

      expect(result.length).toBe(1);
      expect(result[0].name).toBe(TESTING_NAME);
    });
  });

  describe('save', () => {
    const SERIAL_NAME = 'Serial';
    let serialId: ObjectID;

    it('should create new serial', async () => {
      const serial = new SerialDto();
      serial.name = SERIAL_NAME;
      serial.alias = ['Alias'];
      serial.country = ['Russia'];
      serial.director = [];
      serial.genre = [];
      serial.voiceover = [];
      serial.season = [];

      const result = await service.save(serial);

      expect(result.name).toBe(SERIAL_NAME);
      expect(result.id).toBeDefined();
      serialId = result.id;
    });

    it('should update existing serial', async () => {
      const serial = new SerialDto();
      serial.name = SERIAL_NAME;
      serial.alias = ['Alias'];
      serial.country = ['Russia'];
      serial.director = [];
      serial.genre = [];
      serial.voiceover = [];
      serial.season = [
        {
          name: '1 сезон',
          starts: 2020,
          url: 'test.ru',
          desc: '',
          img: '',
          actors: [''],
        },
      ];

      const result = await service.save(serial);
      expect(result.id).toStrictEqual(serialId);
    });

    it('should throw expection if find more then 1 serial', async () => {
      const serial = new model();
      serial.name = SERIAL_NAME;
      serial.alias = ['Alias'];
      serial.country = ['Russia'];
      serial.director = [];
      serial.genre = [];
      serial.voiceover = [];
      serial.season = [];
      const duplicate = await serial.save();
      expect(duplicate.id).not.toStrictEqual(serialId);

      try {
        await service.save(serial);
      } catch (e) {
        expect(e).toBeInstanceOf(DuplicateSerialException);
      }
    });
  });

  afterAll(() => {
    model.remove({});
  });
});
