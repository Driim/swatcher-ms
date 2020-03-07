import { Injectable } from '@nestjs/common';

@Injectable()
export class UIService {
  getHello(): string {
    return 'Hello World!';
  }
}
