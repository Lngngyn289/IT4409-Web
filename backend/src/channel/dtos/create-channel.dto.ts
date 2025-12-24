import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChannelDto {
  @IsString()
  @ApiProperty({ example: 'general' })
  name: string;

  @IsString()
  @ApiProperty({ example: 'wks-uuid-here' })
  workspaceId: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Channel for general discussions', required: false })
  description?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ example: false, required: false })
  isPrivate?: boolean;
}
