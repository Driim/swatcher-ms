import { RpcException } from '@nestjs/microservices';
import { User } from '../interfaces';

export class SwatcherNothingFoundException extends RpcException {
  constructor(public readonly user: User, public readonly searching: string) {
    super(`Nothing was found: ${searching}`);
  }
}
