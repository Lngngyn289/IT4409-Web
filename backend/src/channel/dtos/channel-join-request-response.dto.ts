import { ApiProperty } from '@nestjs/swagger';
import { JOIN_REQUEST_STATUS } from '../../common/constants/join-request-status.constant';

export class ChannelJoinRequestResponseDto {
  @ApiProperty({ example: 'req-123' })
  id: string;

  @ApiProperty({ example: 'channel-456' })
  channelId: string;

  @ApiProperty({ example: 'user-789' })
  userId: string;

  @ApiProperty({
    enum: Object.values(JOIN_REQUEST_STATUS),
    example: JOIN_REQUEST_STATUS.PENDING,
    description: 'Trạng thái của yêu cầu tham gia',
  })
  status: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ required: false, example: '2024-01-02T00:00:00.000Z' })
  reviewedAt?: Date;

  @ApiProperty({ required: false, example: 'admin-user-id' })
  reviewedBy?: string;

  @ApiProperty({
    description: 'Thông tin người gửi yêu cầu',
    example: {
      id: 'user-789',
      email: 'user@example.com',
      username: 'username',
      fullName: 'User Name',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
  })
  user: {
    id: string;
    email: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
  };

  @ApiProperty({
    description: 'Thông tin channel được yêu cầu tham gia',
    example: {
      id: 'channel-456',
      name: 'General',
      workspaceId: 'workspace-123',
    },
  })
  channel: {
    id: string;
    name: string;
    workspaceId: string;
  };
}
