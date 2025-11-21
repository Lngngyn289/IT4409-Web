import { ApiProperty } from '@nestjs/swagger';

export class ChannelResponseDto {
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

  @ApiProperty({ required: false })
  joinCode?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  myRole?: string | null;

  @ApiProperty()
  memberCount: number;
}

export class ChannelListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  isPrivate: boolean;

  @ApiProperty()
  memberCount: number;

  @ApiProperty({ required: false })
  myRole?: string | null;
}

