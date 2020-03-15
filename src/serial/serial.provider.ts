import * as Fuse from 'fuse.js';
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ObjectID } from 'typeorm';
import { Serial } from '../models/serial.model';
import { SerialDto } from '../dto/serial.dto';
import {
  FUZZY_SORT,
  FUZZY_THRESHOLD,
  FUZZY_LOCATION,
  FUZZY_DISTANCE,
  FUZZY_PATTERN_LENGTH,
  FUZZY_MIN_MATCH,
} from '../app.constants';

@Injectable()
export class SerialService {
  private readonly logger = new Logger(SerialService.name);
  private fuse = null;
  private readonly fuseOpts = {
    shouldSort: FUZZY_SORT,
    threshold: FUZZY_THRESHOLD,
    location: FUZZY_LOCATION,
    distance: FUZZY_DISTANCE,
    maxPatternLength: FUZZY_PATTERN_LENGTH,
    minMatchCharLength: FUZZY_MIN_MATCH,
    /* searching only in serials names */
    keys: ['name'],
  };

  constructor(
    @InjectRepository(Serial)
    private readonly repo: Repository<Serial>,
  ) {}

  private async findByIds(ids: ObjectID[]): Promise<Serial[]> {
    return await this.repo.findByIds(ids);
  }

  async updateIndex(): Promise<void> {
    const names = await this.repo.find({ select: ['name'] });

    this.logger.log(`Обновили индекс, в базе ${names.length} сериалов`);
    this.fuse = new Fuse(names, this.fuseOpts);
  }

  async find(name: string): Promise<Serial[]> {
    const exactMatch = await this.repo.find({ where: { $or: [{ name }, { alias: name }] } });

    if (exactMatch.length > 0) {
      return exactMatch;
    }

    if (!this.fuse) {
      return [];
    }

    const notExactMatch = this.fuse.search(name) as Array<{ id: ObjectID; name: string }>;
    const ids = notExactMatch.map((serial) => serial.id);

    return this.findByIds(ids);
  }

  async save(serial: SerialDto): Promise<Serial> {
    const existing = await this.repo.find({
      where: { name: serial.name, alias: serial.alias, country: serial.country },
    });

    if (existing.length === 0) {
      this.logger.log(`В базе данных нет сериала ${serial.name}, создаем...`);
      return this.repo.save(serial);
    } else if (existing.length === 1) {
      const result = existing[0];

      const duplicate = result.season.find((elem) => {
        return elem.url === serial.season[0].url;
      });

      if (!duplicate) {
        this.logger.log(`Сериал ${serial.name} есть, а ${serial.season[0].name} нет. Добавляем...`);
        result.season.push(serial.season[0]);
      }

      return this.repo.save(result);
    } else {
      /* TODO: made duplicate serial error */
      throw new BadRequestException();
    }
  }
}
