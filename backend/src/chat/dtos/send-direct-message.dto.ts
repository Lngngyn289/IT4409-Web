import { IsString, IsOptional, IsArray, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendDirectMessageDto {
  @ApiProperty({ description: 'Workspace ID' })
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @ApiProperty({
    description: 'Conversation ID (nếu đã có) hoặc null (tạo mới)',
  })
  @IsString()
  @IsOptional()
  conversationId?: string;

  @ApiProperty({ description: 'ID của user nhận tin nhắn' })
  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @ApiProperty({ description: 'Nội dung tin nhắn' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    description: 'ID tin nhắn được reply',
    required: false,
  })
  @IsString()
  @IsOptional()
  replyToId?: string;

  @ApiPropertyOptional({
    description: 'Danh sách URL file đính kèm',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachmentUrls?: string[];
}
