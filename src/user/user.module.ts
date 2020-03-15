import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.provider';
import { UserController } from './user.controller';
import { User } from '../models/user.model';
import { TRANSPORT_SERVICE } from '../app.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ClientsModule.register([
      {
        name: TRANSPORT_SERVICE,
        transport: Transport.REDIS,
        options: { url: 'redis://localhost:6379' },
      },
    ]),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
