import { Controller, Inject, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { ClientProxy, EventPattern, Payload, MessagePattern } from '@nestjs/microservices';
import * as Fuse from 'fuse.js';
import { SerialService } from './serial.provider';
import { TRANSPORT_SERVICE } from 'src/app.constants';
import { Serial } from '../models/serial.model';
import { SerialDto } from '../dto/serial.dto';

@Controller()
export class SerialController {
  private readonly logger = new Logger(SerialController.name);
  private readonly opts = {
    shouldSort: true,
    threshold: 0.4,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 2,
    keys: ['name'],
  };
  private fuse = null;

  constructor(
    @Inject(TRANSPORT_SERVICE)
    private readonly client: ClientProxy,
    private readonly service: SerialService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.client.connect();
  }

  /* Regenerate fuzzy search index */
  @EventPattern('serial_index')
  async receivedMessage(): Promise<void> {
    const names = await this.service.names();

    this.logger.log(`В базе ${names.length} сериалов`);

    this.fuse = new Fuse(names, this.opts);
  }

  @MessagePattern({ cmd: 'serial_find' })
  async find(@Payload() name: string): Promise<Serial[]> {
    return await this.service.findByName(name);
  }

  @MessagePattern({ cmd: 'serial_fuzzy' })
  async fuzzy(@Payload() name: string): Promise<Serial[]> {
    const serials = await this.service.findByName(name);

    if (serials.length > 0) {
      return serials;
    }

    if (!this.fuse) {
      return [];
    }

    const result = this.fuse.search(name);
    if (!result || !result.length) {
      return [];
    }

    const ids = result.map((serial) => serial.id);
    return await this.service.findByIds(ids);
  }

  @MessagePattern({ cmd: 'serial_save' })
  @UsePipes(ValidationPipe)
  async create(@Payload() serial: SerialDto): Promise<Serial> {
    return await this.service.save(serial);
  }
}
