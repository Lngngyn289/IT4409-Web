import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePostDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiProperty({
    example: 'Updated post content!',
    description: 'New content of the post',
    required: false,
  })
  content?: string;
}


