export class DirectConversationParticipantDto {
  id: string;
  username: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

export class LastMessageDto {
  id: string;
  content?: string;
  senderId: string;
  senderName: string;
  isDeleted: boolean;
  createdAt: Date;
}

export class DirectConversationItemDto {
  id: string;
  otherParticipant: DirectConversationParticipantDto;
  lastMessage?: LastMessageDto;
  unreadCount: number;
  updatedAt: Date;
  createdAt: Date;
}

export class DirectConversationListResponseDto {
  conversations: DirectConversationItemDto[];
  total: number;
}

export class CreateDirectConversationDto {
  workspaceId: string;
  otherUserId: string;
}
