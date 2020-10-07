import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';

@Catch()
export class UnhandledExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(UnhandledExceptionsFilter.name);

  constructor(@InjectSentry() private readonly client: SentryService) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  catch(exception: unknown, _host: ArgumentsHost): void {
    this.logger.error(`Поймал необработонную ошибку: ${exception.toString()}`);
    this.client.instance().captureException(exception);
  }
}
