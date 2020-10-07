import { ExceptionFilter, Catch, ArgumentsHost, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  SwatcherBadRequestException,
  SwatcherLimitExceedException,
  SwatcherNothingFoundException,
  SwatcherUserNotFoundException,
} from '../exceptions';
import { TRANSPORT_SERVICE } from '../app.constants';
import {
  MESSAGE_ERROR_BAD_REQUEST,
  MESSAGE_ERROR_NOTHING_FOUND,
  MESSAGE_ERROR_LIMIT_EXCEED,
  MESSAGE_ERROR_USER_NOT_FOUND,
} from '../app.strings';

@Catch()
export class SwatcherExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(SwatcherExceptionsFilter.name);

  constructor(
    @Inject(TRANSPORT_SERVICE)
    private readonly client: ClientProxy,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async catch(exception: unknown, _host: ArgumentsHost): Promise<void> {
    let message: string;
    let id: number;

    this.logger.warn(`Поймал ошибку: ${exception.constructor.name}`);
    switch (exception.constructor) {
      case SwatcherBadRequestException: {
        const exp = exception as SwatcherBadRequestException;
        message = `${MESSAGE_ERROR_BAD_REQUEST}: ${exp.searching}`;
        id = exp.user.id;
        break;
      }
      case SwatcherLimitExceedException: {
        /** Consider handling this exception in UI code */
        const exp = exception as SwatcherLimitExceedException;
        id = exp.user.id;
        message = `${MESSAGE_ERROR_LIMIT_EXCEED}: ${id}`;
        break;
      }
      case SwatcherNothingFoundException: {
        const exp = exception as SwatcherNothingFoundException;
        message = `${MESSAGE_ERROR_NOTHING_FOUND}: ${exp.searching}`;
        id = exp.user.id;
        break;
      }
      case SwatcherUserNotFoundException: {
        const exp = exception as SwatcherUserNotFoundException;
        id = exp.id;
        message = `${MESSAGE_ERROR_USER_NOT_FOUND}`;
        break;
      }
      default: {
        throw exception;
      }
    }

    await this.client
      .emit<void>('send_message', { user: id, message })
      .toPromise();
  }
}
