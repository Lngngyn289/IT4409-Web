export interface JwtPayload {
  id: string;
  email: string;

  rolesByWorkspace: {
    workspaceId: string;
    role: string;
  }[];

  rolesByChannel: {
    channelId: string;
    role: string;
  }[];
}
