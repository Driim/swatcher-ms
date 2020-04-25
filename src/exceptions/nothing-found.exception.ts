import { RpcException } from '@nestjs/microservices';
import { User } from '../interfaces';

export class SwatcherNothingFoundException extends RpcException {
  constructor(private readonly user: User, private readonly searching: string) {
    super(`Nothing was found: ${searching}`);
  }
}
