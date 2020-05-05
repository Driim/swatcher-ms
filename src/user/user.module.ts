import { Module } from '@nestjs/common';
import { Transport, ClientProxyFactory } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { TRANSPORT_SERVICE, UserName } from '../app.constants';
import { UserService } from './user.provider';
import { UserSchema } from '../schemas';
import { SubscriptionModule } from '../subscription/subscription.module';
import { ConfigService } from '@nestjs/config';
import { RedisOptions } from '@nestjs/common/interfaces/microservices/microservice-configuration.interface';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserName, schema: UserSchema }]),
    SubscriptionModule,
  ],
  providers: [
    {
      provide: TRANSPORT_SERVICE,
      useFactory: (config: ConfigService) => {
        const options: RedisOptions = {
          transport: Transport.REDIS,
          options: {
            url: config.get<string>('REDIS_URI')
          }
        }
        return ClientProxyFactory.create(options);
      },
      inject: [ConfigService]
    },
    UserService
  ],
  exports: [UserService],
})
export class UserModule {}
