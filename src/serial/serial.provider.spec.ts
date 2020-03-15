import { Test, TestingModule } from '@nestjs/testing';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, ObjectID } from 'typeorm';
import { SerialService } from './serial.provider';
import { TRANSPORT_SERVICE } from '../app.constants';
import { Serial } from '../models/serial.model';
import { SerialDto } from '../dto/serial.dto';
import { BadRequestException } from '@nestjs/common';

const TESTING_NAME = 'Testing';

describe('Serial Service', () => {
  let service: SerialService;
  let repo: Repository<Serial>;

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
        TypeOrmModule.forRoot({
          type: 'mongodb',
          host: 'localhost',
          port: 27017,
          useUnifiedTopology: true,
          database: 'swatcher',
          synchronize: true,
          logging: true,
          entities: [Serial],
        }),
        TypeOrmModule.forFeature([Serial]),
      ],
      providers: [SerialService],
    }).compile();

    service = app.get<SerialService>(SerialService);
    repo = app.get(getRepositoryToken(Serial));

    const serial = new Serial();
    serial.name = TESTING_NAME;
    serial.alias = ['Alias'];
    serial.country = ['Russia'];
    serial.director = [];
    serial.genre = [];
    serial.voiceover = [];
    serial.season = [];
    await repo.save(serial);
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
      const serial = new Serial();
      serial.name = SERIAL_NAME;
      serial.alias = ['Alias'];
      serial.country = ['Russia'];
      serial.director = [];
      serial.genre = [];
      serial.voiceover = [];
      serial.season = [];
      const duplicate = await repo.save(serial);
      expect(duplicate.id).not.toStrictEqual(serialId);

      try {
        await service.save(serial);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
      }
    });
  });

  afterAll(() => {
    repo.clear();
  });
});
