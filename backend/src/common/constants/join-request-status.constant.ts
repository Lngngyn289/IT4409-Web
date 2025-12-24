export const JOIN_REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type JoinRequestStatus =
  (typeof JOIN_REQUEST_STATUS)[keyof typeof JOIN_REQUEST_STATUS];
