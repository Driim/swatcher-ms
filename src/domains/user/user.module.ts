import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport, ClientProxyFactory } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { TRANSPORT_SERVICE, USER_COLLECTION } from '../../app.constants';
import { UserService } from './user.provider';
import { UserSchema } from '../../schemas';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: USER_COLLECTION, schema: UserSchema }]),
    SubscriptionModule,
  ],
  providers: [
    {
      provide: TRANSPORT_SERVICE,
      useFactory: (config: ConfigService) => {
        const options: any = {
          transport: Transport.REDIS,
          options: {
            url: config.get<string>('REDIS_URI'),
          },
        };
        return ClientProxyFactory.create(options);
      },
      inject: [ConfigService],
    },
    UserService,
  ],
  exports: [UserService],
})
export class UserModule {}
