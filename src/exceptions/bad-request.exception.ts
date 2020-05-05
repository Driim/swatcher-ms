import { RpcException } from '@nestjs/microservices';
import { User } from '../interfaces';

export class SwatcherBadRequestException extends RpcException {
  constructor(private readonly user: User, private readonly searching: string) {
    super(`Bad request ${searching} for ${user.id}`);
  }
}
