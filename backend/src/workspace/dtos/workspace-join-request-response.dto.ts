export class WorkspaceJoinRequestItemDto {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  status: string;
  createdAt: Date;
}

export class WorkspaceJoinRequestListResponseDto {
  requests: WorkspaceJoinRequestItemDto[];
  totalCount: number;
  myRole: string;
}
