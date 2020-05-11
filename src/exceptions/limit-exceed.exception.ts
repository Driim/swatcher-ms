import { RpcException } from '@nestjs/microservices';
import { User } from '../interfaces';

export class SwatcherLimitExceedException extends RpcException {
  constructor(public readonly user: User, public readonly searching: string) {
    super(`Limit exceed ${searching}`);
  }
}
