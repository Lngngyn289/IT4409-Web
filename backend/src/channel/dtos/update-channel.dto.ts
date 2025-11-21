import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateChannelDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'general-updated', required: false })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ 
    example: 'Updated channel description', 
    required: false 
  })
  description?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ example: true, required: false })
  isPrivate?: boolean;
}

