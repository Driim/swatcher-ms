import { ExceptionFilter, Catch, ArgumentsHost, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SwatcherError } from '../interfaces';
import { TRANSPORT_SERVICE } from '../app.constants';

@Catch()
export class UnhandledExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(UnhandledExceptionsFilter.name);

  constructor(@Inject(TRANSPORT_SERVICE) private readonly client: ClientProxy) {}
  catch(exception: unknown, _host: ArgumentsHost): Promise<void> {
    const error: SwatcherError = {
      user: 0,
      error: exception.toString(),
      type: 'UMS:unhandled',
    };

    this.logger.error(`Поймал необработонную ошибку: ${exception.toString()}`);
    return this.client.emit<void, SwatcherError>('handle_error', error).toPromise();
  }
}
