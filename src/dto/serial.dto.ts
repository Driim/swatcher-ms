import { IsString, ValidateNested, IsNotEmpty } from 'class-validator';
import { SeasonDto } from './season.dto';

export class SerialDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  alias: string[];

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  genre: string[];

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  country: string[];

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  director: string[];

  @IsString({ each: true })
  voiceover: string[];

  @ValidateNested()
  season: SeasonDto[];
}
