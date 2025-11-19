import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    required: false,
    description: 'Whether this workspace is private. Default = false',
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
