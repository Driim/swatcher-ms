import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { TRANSPORT_SERVICE, UserName } from '../app.constants';
import { UserService } from './user.provider';
import { UserSchema } from '../schemas';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserName, schema: UserSchema }]),
    ClientsModule.register([
      {
        name: TRANSPORT_SERVICE,
        transport: Transport.REDIS,
        options: { url: 'redis://localhost:6379' },
      },
    ]),
    SubscriptionModule
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
