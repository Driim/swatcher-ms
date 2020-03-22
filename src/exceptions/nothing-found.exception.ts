import { RpcException } from '@nestjs/microservices';

export class NothingFoundException extends RpcException {
  constructor(searching: string) {
    super(`Nothing was found: ${searching}`);
  }
}
