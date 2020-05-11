import * as escapeString from 'escape-string-regexp';
import { Controller, Logger, UsePipes, ValidationPipe, UseFilters } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { SwatcherUserNotFoundException } from '../exceptions/user-not-found.exception';
import { TelegramMessageDto } from '../dto/message.dto';
import { MESSAGE_CREATE_USER } from '../app.strings';
import { UserService } from '../user/user.provider';
import { UIService } from './ui.service';
import { COMMAND_START } from '../app.constants';
import { SwatcherExceptionsFilter, UnhandledExceptionsFilter } from '../filters';

@Controller()
export class UIController {
  private readonly logger = new Logger(UIController.name);

  constructor(private readonly userService: UserService, private readonly uiService: UIService) {}

  @UsePipes(ValidationPipe)
  @UseFilters(UnhandledExceptionsFilter, SwatcherExceptionsFilter)
  @EventPattern('received_message')
  async receivedMessage(@Payload() data: TelegramMessageDto): Promise<void> {
    const user = await this.userService.find(data.id);
    const text = escapeString(data.message);

    console.log(user);

    if (!user) {
      /* The only command working without registration */
      if (COMMAND_START.test(text)) {
        this.logger.log(`Создаем нового пользователя ${data.id}`);
        const newUser = await this.userService.create(data.id, data.username);
        return await this.uiService.sendMessage(newUser, MESSAGE_CREATE_USER(newUser.username));
      } else {
        throw new SwatcherUserNotFoundException(data.id);
      }
    }

    const handlers = this.uiService.getHandlers();
    const handler = handlers.find((handler) => {
      return handler.regexp.test(data.message);
    });

    if (handler) {
      const message = handler.regexp.exec(text)[1];
      await handler.handle(user, message);
    } else {
      /** default action */
      await this.uiService.find(user, text);
    }
  }
}
