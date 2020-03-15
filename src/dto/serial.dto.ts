import { IsString, IsInt, Min, ValidateNested, IsNotEmpty } from 'class-validator';

class SeasonDto {
  @IsString()
  name: string;

  @IsString()
  desc: string;

  @IsString()
  img: string;

  @IsString()
  url: string;

  @IsInt()
  @Min(1960)
  starts: number;

  @IsString({ each: true })
  actors: string[];
}

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
