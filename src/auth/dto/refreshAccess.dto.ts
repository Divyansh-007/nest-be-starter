import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class RefreshAccessDto {
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
