import { Controller, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { Payload, MessagePattern } from '@nestjs/microservices';
import { SerialService } from './serial.provider';
import { Serial } from '../interfaces/serial.interface';
import { SerialDto } from '../dto/serial.dto';

@Controller()
export class SerialController {
  private readonly logger = new Logger(SerialController.name);

  constructor(private readonly service: SerialService) {}

  @MessagePattern({ cmd: 'serial_find' })
  @UsePipes(ValidationPipe)
  async find(@Payload() name: string): Promise<Serial[]> {
    return this.service.find(name);
  }

  @MessagePattern({ cmd: 'serial_save' })
  @UsePipes(ValidationPipe)
  async save(@Payload() serial: SerialDto): Promise<Serial> {
    return this.service.save(serial);
  }
}
