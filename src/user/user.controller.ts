import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import { Payload, EventPattern } from '@nestjs/microservices';
import { UserService } from './user.provider';

@Controller()
export class UserController {
  constructor(private readonly service: UserService) {}

  @UsePipes(ValidationPipe)
  @EventPattern('user_block')
  async handeBlock(@Payload() id: number): Promise<void> {
    return this.service.block(id);
  }
}
