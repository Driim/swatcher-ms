import { Controller, Logger, UsePipes, ValidationPipe, UseFilters } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { SwatcherUserNotFoundException } from '../../exceptions/user-not-found.exception';
import { TelegramMessageDto, AnnounceDto } from '../../dto';
import { MESSAGE_CREATE_USER } from '../../app.strings';
import { UserService } from '../../domains/user/user.provider';
import { UIService } from './ui.service';
import { COMMAND_START } from '../../app.constants';
import { SwatcherExceptionsFilter, UnhandledExceptionsFilter } from '../../filters';

// eslint-disable-next-line no-useless-escape
const escapeRegexp = (str: string) => str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');

@Controller()
@UsePipes(ValidationPipe)
@UseFilters(UnhandledExceptionsFilter, SwatcherExceptionsFilter)
export class UIController {
  private readonly logger = new Logger(UIController.name);

  constructor(private readonly userService: UserService, private readonly uiService: UIService) {}

  @EventPattern('received_announce')
  async receivedAnnounce(@Payload() data: AnnounceDto): Promise<void> {
    await this.uiService.receivedAnnounce(data);
  }

  @EventPattern('received_message')
  async receivedMessage(@Payload() data: TelegramMessageDto): Promise<void> {
    const user = await this.userService.find(data.id);
    const text = escapeRegexp(data.message);

    if (!user) {
      /* The only command working without registration */
      if (COMMAND_START.test(text)) {
        this.logger.log(`Создаем нового пользователя ${data.id}`);
        const newUser = await this.userService.create(data.id, data.username);
        return this.uiService.sendMessage(
          newUser,
          MESSAGE_CREATE_USER(newUser.username, newUser.id),
        );
      }
      throw new SwatcherUserNotFoundException(data.id);
    }

    const handlers = this.uiService.getHandlers();
    const handler = handlers.find((currentHandler) => {
      return currentHandler.regexp.test(data.message);
    });

    if (handler) {
      const message = handler.regexp.exec(text)[1];
      return handler.handle(user, message);
    }

    return this.uiService.find(user, text);
  }
}
