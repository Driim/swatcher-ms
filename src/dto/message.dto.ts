import { IsString, IsInt, IsNotEmpty } from 'class-validator';

export class TelegramMessageDto {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
