import * as Fuse from 'fuse.js';
import { Injectable, Logger } from '@nestjs/common';
import { Serial } from '../interfaces/serial.interface';
import { SerialDto } from '../dto/serial.dto';
import {
  FUZZY_SORT,
  FUZZY_THRESHOLD,
  FUZZY_LOCATION,
  FUZZY_DISTANCE,
  FUZZY_PATTERN_LENGTH,
  FUZZY_MIN_MATCH,
  SerialName,
} from '../app.constants';
import { DuplicateSerialException } from '../exceptions/duplicate-serial.exception';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Schema } from 'mongoose';

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

  constructor(@InjectModel(SerialName) private serial: Model<Serial>) {}

  private async findByIds(ids: string[]): Promise<Serial[]> {
    return await this.serial.find({ _id: { $in: ids } }).exec();
  }

  async updateIndex(): Promise<void> {
    const names = await this.serial.find({}, 'name').exec();

    this.logger.log(`Обновили индекс, в базе ${names.length} сериалов`);
    this.fuse = new Fuse(names, this.fuseOpts);
  }

  async find(name: string): Promise<Serial[]> {
    const exactMatch = await this.serial
      .find()
      .or([{ name }, { alias: name }])
      .exec();

    if (exactMatch.length > 0) {
      return exactMatch;
    }

    if (!this.fuse) {
      this.logger.warn(`Точного совпадения по ${name} нет, а для неточного поиска нет индекса!`);
      return [];
    }

    const notExactMatch = this.fuse.search(name) as Array<{
      _id: Schema.Types.ObjectId;
      name: string;
    }>;
    const ids = notExactMatch.map((serial) => serial._id.toString());

    return this.findByIds(ids);
  }

  async save(dto: SerialDto): Promise<Serial> {
    const existing = await this.serial.find({ name: dto.name, country: dto.country });

    if (existing.length === 0) {
      this.logger.log(`В базе данных нет сериала ${dto.name}, создаем...`);
      const serial = new this.serial(dto);
      return serial.save();
    } else if (existing.length === 1) {
      const result = existing[0];

      /* FIXME: need to find diff of 2 arrays by season name and/or url */
      const duplicate = result.season.find((elem) => {
        return elem.url === dto.season[0].url;
      });

      if (!duplicate) {
        this.logger.log(`Сериал ${dto.name} есть, а ${dto.season[0].name} нет. Добавляем...`);
        result.season.push(dto.season[0]);
      }

      return result.save();
    } else {
      throw new DuplicateSerialException(dto);
    }
  }
}
