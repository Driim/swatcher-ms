import { RpcException } from '@nestjs/microservices';
import { User } from '../interfaces';

export class SwatcherLimitExceedException extends RpcException {
  constructor(private readonly user: User, private readonly searching: string) {
    super(`Limit exceed ${searching}`);
  }
}
