import { RpcException } from '@nestjs/microservices';

export class UserNotFoundException extends RpcException {
  constructor() {
    super('User not found');
  }
}
