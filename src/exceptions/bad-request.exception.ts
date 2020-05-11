import { RpcException } from '@nestjs/microservices';
import { User } from '../interfaces';

export class SwatcherBadRequestException extends RpcException {
  constructor(public readonly user: User, public readonly searching: string) {
    super(`Bad request ${searching} for ${user.id}`);
  }
}
