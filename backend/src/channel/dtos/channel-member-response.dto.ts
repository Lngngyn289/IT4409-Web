import { ApiProperty } from '@nestjs/swagger';

export class ChannelMemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  channelId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  roleName: string;

  @ApiProperty()
  joinedAt: Date;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
  };
}
