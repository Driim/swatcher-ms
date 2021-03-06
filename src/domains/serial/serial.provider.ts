import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model, Schema } from 'mongoose';
import Fuse from 'fuse.js';
import { Serial } from '../../interfaces';
import {
  FUZZY_SORT,
  FUZZY_THRESHOLD,
  FUZZY_MIN_MATCH,
  SERIAL_COLLECTION,
} from '../../app.constants';

@Injectable()
export class SerialService {
  private readonly logger = new Logger(SerialService.name);

  private fuse: Fuse<Serial> = null;

  private readonly fuseOpts = {
    includeScore: true,
    shouldSort: FUZZY_SORT,
    threshold: FUZZY_THRESHOLD,
    minMatchCharLength: FUZZY_MIN_MATCH,
    /* searching only in serials names */
    keys: ['name'],
  };

  constructor(@InjectModel(SERIAL_COLLECTION) private serial: Model<Serial>) {}

  private async findByIds(ids: string[]): Promise<Serial[]> {
    return this.serial.find({ _id: { $in: ids } }).exec();
  }

  onApplicationBootstrap(): void {
    this.logger.log('Application bootstrap index update');
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.updateIndex();
  }

  @Cron('0 10 0 * * *')
  async updateIndex(): Promise<void> {
    const names = await this.serial.find({}, 'name').exec();

    this.logger.log(`Обновили индекс, в базе ${names.length} сериалов`);
    this.fuse = new Fuse(names, this.fuseOpts);
  }

  async findExact(name: string): Promise<Serial> {
    return this.serial.findOne({ name }).exec();
  }

  async find(name: string): Promise<Serial[]> {
    const exactMatch = await this.serial
      .find()
      .or([{ name: new RegExp(name, 'i') }, { alias: new RegExp(name, 'i') }])
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
