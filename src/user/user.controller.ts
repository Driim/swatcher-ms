import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload, EventPattern } from '@nestjs/microservices';
import { User } from '../models/user.model';
import { UserDto } from '../dto/user.dto';
import { UserService } from './user.provider';

@Controller()
export class UserController {
  constructor(private readonly service: UserService) {}

  @MessagePattern({ cmd: 'user_find' })
  async find(@Payload() id: number): Promise<User> {
    return await this.service.find(id);
  }

  @UsePipes(ValidationPipe)
  @MessagePattern({ cmd: 'user_save' })
  async save(@Payload() data: UserDto): Promise<User> {
    let user = await this.service.find(data.id);

    user = Object.assign(user, data);

    return await this.service.save(user);
  }

  @UsePipes(ValidationPipe)
  @EventPattern('user_block')
  async handeBlock(@Payload() id: number): Promise<void> {
    const user = await this.service.find(id);

    if (user) {
      user.active = false;
      this.service.save(user);
    }
  }
}
