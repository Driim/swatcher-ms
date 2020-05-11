import { Controller, UsePipes, ValidationPipe, Logger } from '@nestjs/common';
import { Payload, EventPattern } from '@nestjs/microservices';
import { UserService } from './user.provider';

@Controller()
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly service: UserService) {}

  @UsePipes(ValidationPipe)
  @EventPattern('handle_block')
  async handeBlock(@Payload() id: number): Promise<void> {
    this.logger.log(`Блокируем пользователя ${id}`);
    return this.service.block(id);
  }
}
