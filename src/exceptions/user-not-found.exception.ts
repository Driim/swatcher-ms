import { RpcException } from '@nestjs/microservices';

export class SwatcherUserNotFoundException extends RpcException {
  constructor(public readonly id: number) {
    super(`User ${id} not found`);
  }
}
