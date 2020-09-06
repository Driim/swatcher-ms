import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model, Schema, Types } from 'mongoose';
import Fuse from 'fuse.js';
import { Serial } from '../../interfaces';
import {
  FUZZY_SORT,
  FUZZY_THRESHOLD,
  FUZZY_LOCATION,
  FUZZY_DISTANCE,
  FUZZY_PATTERN_LENGTH,
  FUZZY_MIN_MATCH,
  SERIAL_COLLECTION,
} from '../../app.constants';

@Injectable()
export class SerialService {
  private readonly logger = new Logger(SerialService.name);
  private fuse = null;
  private readonly fuseOpts = {
    includeScore: true,
    shouldSort: FUZZY_SORT,
    threshold: FUZZY_THRESHOLD,
    // location: FUZZY_LOCATION,
    // distance: FUZZY_DISTANCE,
    // maxPatternLength: FUZZY_PATTERN_LENGTH,
    minMatchCharLength: FUZZY_MIN_MATCH,
    /* searching only in serials names */
    keys: ['name'],
  };

  constructor(@InjectModel(SERIAL_COLLECTION) private serial: Model<Serial>) {}

  private async findByIds(ids: string[]): Promise<Serial[]> {
    return await this.serial.find({ _id: { $in: ids } }).exec();
  }

  onApplicationBootstrap() {
    this.logger.log('Application bootstrap index update');
    this.updateIndex();
  }

  @Cron('0 10 0 * * *')
  async updateIndex(): Promise<void> {
    const names = await this.serial.find({}, 'name').exec();

    this.logger.log(`Обновили индекс, в базе ${names.length} сериалов`);
    this.fuse = new Fuse(names, this.fuseOpts);
  }

  async findExact(name: string): Promise<Serial> {
    return await this.serial.findOne({ name }).exec();
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
      item: {
        _id: Schema.Types.ObjectId;
        name: string;
      };
      refIndex: number;
    }>;
    const ids = notExactMatch.map((result) => result.item._id.toString());

    return this.findByIds(ids);
  }
}
