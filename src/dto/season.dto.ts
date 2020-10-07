import { IsInt, IsString, Min } from 'class-validator';

export class SeasonDto {
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
