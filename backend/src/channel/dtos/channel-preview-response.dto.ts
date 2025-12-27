import { ApiProperty } from '@nestjs/swagger';

export class ChannelPreviewResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  workspaceId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  isPrivate: boolean;

  @ApiProperty()
  memberCount: number;

  @ApiProperty()
  isMember: boolean;

  @ApiProperty()
  canJoin: boolean;
}
