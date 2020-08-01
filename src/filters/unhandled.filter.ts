import { ExceptionFilter, Catch, ArgumentsHost, Logger, Inject } from '@nestjs/common';
import { SwatcherError } from '../interfaces';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';

@Catch()
export class UnhandledExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(UnhandledExceptionsFilter.name);

  constructor(@InjectSentry() private readonly client: SentryService) {}
  catch(exception: unknown, _host: ArgumentsHost): void {
    const error: SwatcherError = {
      user: 0,
      error: exception.toString(),
      type: 'UMS:unhandled',
    };

    this.logger.error(`Поймал необработонную ошибку: ${exception.toString()}`);
    this.client.instance().captureException(exception);
  }
}
