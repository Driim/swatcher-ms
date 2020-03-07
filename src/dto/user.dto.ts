import { IsString, IsInt, IsBoolean } from 'class-validator';

export class UserDto {
  @IsInt()
  id: number;

  @IsString()
  name: string;

  @IsString()
  username: string;

  @IsBoolean()
  active: boolean; /* not active means user blocked bot or somethings else */

  @IsInt()
  payed: number;
}
