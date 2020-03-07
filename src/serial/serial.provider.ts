import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ObjectID } from 'typeorm';
import { Serial } from '../models/serial.model';
import { SerialDto } from 'src/dto/serial.dto';

@Injectable()
export class SerialService {
  private readonly logger = new Logger(SerialService.name);

  constructor(
    @InjectRepository(Serial)
    private readonly repo: Repository<Serial>,
  ) {}

  async findByIds(ids: ObjectID[]): Promise<Serial[]> {
    return await this.repo.findByIds(ids);
  }

  async findByName(name: string): Promise<Serial[]> {
    return await this.repo.find({ where: [{ name: name }, { alias: name }] });
  }

  async names(): Promise<Serial[]> {
    return await this.repo.find({ select: ['name'] });
  }

  async save(serial: SerialDto): Promise<Serial> {
    const existing = await this.repo.find({
      where: { name: serial.name, alias: serial.alias, country: serial.country },
    });

    if (existing.length === 0) {
      this.logger.log(`В базе данных нет сериала ${serial.name}, создаем...`);
      return await this.repo.save(serial);
    } else if (existing.length === 1) {
      const result = existing[0];

      const duplicate = result.season.some((elem) => {
        return elem.url === serial.season[0].url;
      });

      if (duplicate === false) {
        this.logger.log(`Сериал ${serial.name} есть, а ${serial.season[0].name} нет. Добавляем...`);
        result.season.push(serial.season[0]);
      }

      return await this.repo.save(result);
    } else {
      throw new BadRequestException();
    }
  }
}
