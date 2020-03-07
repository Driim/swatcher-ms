import { Controller, Inject, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import * as escapeString from 'escape-string-regexp';
import { UIService } from '../providers/ui.service';
import { TRANSPORT_SERVICE } from 'src/app.constants';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';
import { TelegramMessageDto } from 'src/dto/message.dto';
import { User } from 'src/models/user.model';

interface MessageHander {
  handle: (user: User, message: string) => Promise<void>;
  regexp: RegExp;
  shouldExist: boolean;
}

@Controller()
export class UIController {
  private readonly logger = new Logger(UIController.name);
  private handlers: MessageHander[] = [];

  constructor(
    @Inject(TRANSPORT_SERVICE)
    private readonly client: ClientProxy,
    private readonly service: UIService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.client.connect();
  }

  @UsePipes(ValidationPipe)
  @EventPattern('received_message')
  async receivedMessage(@Payload() data: TelegramMessageDto): Promise<void> {
    this.logger.log(data);

    const user = await this.client.send<User>('user_find', data.id).toPromise();

    const handler = this.handlers.find((handler) => {
      const result = handler.regexp.test(data.message);
      if (result && !user && handler.shouldExist) {
        /* this function accept calls only from existing users */
        throw new Error(); /* TODO: */
      }

      return result;
    });

    let message = handler.regexp.exec(data.message)[1];
    message = escapeString(message);
    await handler.handle(user, message);
  }
}
