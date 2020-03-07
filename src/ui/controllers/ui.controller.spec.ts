import { Test, TestingModule } from '@nestjs/testing';
import { UIController } from './ui.controller';
import { UIService } from '../providers/ui.service';

describe('AppController', () => {
  let appController: UIController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UIController],
      providers: [UIService],
    }).compile();

    appController = app.get<UIController>(UIController);
  });
});
