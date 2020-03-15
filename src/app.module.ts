import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerialModule } from './serial/serial.module';
import { UserModule } from './user/user.module';
import { UIModule } from './ui/ui.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(),
    SerialModule,
    UserModule,
    UIModule,
  ],
})
export class AppModule {}
