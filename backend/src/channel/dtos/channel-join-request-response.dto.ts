import { ApiProperty } from '@nestjs/swagger';

export class ChannelJoinRequestResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  channelId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  status: string; // PENDING, APPROVED, REJECTED

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  reviewedAt?: Date;

  @ApiProperty({ required: false })
  reviewedBy?: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
  };

  @ApiProperty()
  channel: {
    id: string;
    name: string;
    workspaceId: string;
  };
}

