import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiProperty({
    example: 'Updated comment content!',
    description: 'New content of the comment',
    required: false,
  })
  content?: string;
}


