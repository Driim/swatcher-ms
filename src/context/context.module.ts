import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContextService } from './context.provider';
import { UserContext } from '../app.constants';
import { ContextSchema } from '../schemas/context.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: UserContext, schema: ContextSchema }])],
  providers: [ContextService],
  exports: [ContextService]
})
export class ContextModule {};
