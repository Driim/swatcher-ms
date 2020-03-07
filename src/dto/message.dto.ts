import { IsString, IsInt } from 'class-validator';

export class TelegramMessageDto {
  @IsInt()
  id: number;

  @IsString()
  username: string;

  @IsString()
  message: string;
}
