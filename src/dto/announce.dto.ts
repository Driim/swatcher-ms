import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AnnounceDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  season: string;

  @IsString()
  @IsNotEmpty()
  series: string;

  @IsString()
  @IsOptional()
  voiceover?: string;
}
