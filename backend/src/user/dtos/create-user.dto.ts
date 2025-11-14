import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsIn,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  fullName: string;

  @IsIn(['male', 'female', 'other'])
  gender: 'male' | 'female' | 'other';

  @IsDateString()
  dateOfBirth: string; // YYYY-MM-DD

  @IsOptional()
  avatarUrl?: string;
}
