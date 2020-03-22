import { RpcException } from '@nestjs/microservices';
import { SerialDto } from '../dto/serial.dto';

export class DuplicateSerialException extends RpcException {
  constructor(private readonly serial: SerialDto) {
    super(`Duplicate serial: ${serial.name}`);
  }

  public get name(): string {
    return this.serial.name;
  }

  public get alias(): string[] {
    return this.serial.alias;
  }

  public get country(): string[] {
    return this.serial.country;
  }
}
