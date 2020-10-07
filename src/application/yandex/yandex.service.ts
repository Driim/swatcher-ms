/* eslint-disable no-undef */
import money from 'yandex-money-sdk';
import { Model } from 'mongoose';
import { Interval } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';
import { UserService } from '../../domains/user/user.provider';
import { Payer } from '../../interfaces';
import { PAYER_COLLECTION } from '../../app.constants';

const OPERATIONS_COUNT = 10;

export interface YandexOperation {
  operation_id: string;
  status: string;
  datetime: string;
  title: string;
  pattern_id?: string;
  direction: string;
  amount: number;
  message: string;
  label?: string;
  type?: string;
}

@Injectable()
export class YandexService {
  private wallet: money.Wallet;

  private premiumCost: number;

  private readonly logger = new Logger(YandexService.name);

  constructor(
    @InjectSentry() private readonly client: SentryService,
    @InjectModel(PAYER_COLLECTION) private PayerModel: Model<Payer>,
    private readonly userService: UserService,
    config: ConfigService,
  ) {
    this.wallet = new money.Wallet(config.get<string>('WALLET_TOKEN'));
    this.premiumCost = config.get<number>('PREMIUM_COST');
  }

  private async operationHistory(
    options: YandexMoneySDK.Wallet.OperationHistoryOptions,
  ): Promise<YandexMoneySDK.Wallet.OperationHistoryResult> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const service = this;
    return new Promise((resolve, reject) => {
      service.wallet.operationHistory(options, (err, operations) => {
        if (err) {
          service.logger.error(`Ошибка чтения данных из Яндекс`, err);
          reject(err);
        }

        resolve(operations);
      });
    });
  }

  async handleOperations(operations: YandexOperation[]): Promise<void> {
    for (const operation of operations) {
      if (operation.amount < this.premiumCost || operation.status !== 'success') {
        continue;
      }

      const userId = parseInt(operation.message, 10);
      if (Number.isNaN(userId)) {
        continue;
      }

      const user = await this.userService.find(userId);
      if (user) {
        /** check operation */
        const alreadyExist = await this.PayerModel.findOne({
          amount: operation.amount,
          date: new Date(operation.datetime),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          user: user._id,
        });

        if (alreadyExist) {
          this.logger.debug('Запись уже есть в базе, заканчиваем обработку...');
          return;
        }

        user.payed = 1;
        await user.save();
        const newPayer = new this.PayerModel();
        newPayer.amount = operation.amount;
        newPayer.date = new Date(operation.datetime);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        newPayer.user = user._id;

        await newPayer.save();
      }
    }
  }

  @Interval(45000)
  async getOperations(): Promise<void> {
    let operations: YandexOperation[] = [];

    try {
      /**
       * Using 'as' because OperationHistoryOptions in
       * index.d.ts(yandex-money-sdk) says label is not
       * optional, but it is.
       * */
      const history = await this.operationHistory({
        type: 'deposition',
        records: OPERATIONS_COUNT,
        details: true,
      } as YandexMoneySDK.Wallet.OperationHistoryOptions);

      /**
       * Using 'as' because index.d.ts has not operation.message
       */
      operations = history.operations as YandexOperation[];
    } catch (error) {
      this.client.instance().captureException(error);
    }

    await this.handleOperations(operations);
  }
}
