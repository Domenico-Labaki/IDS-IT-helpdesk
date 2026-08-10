export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  requiresTwoFactor?: boolean;
  twoFactorToken?: string | null;
};

export type TwoFactorSetup = {
  sharedKey: string;
  provisioningUri: string;
};

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department?: string;
  avatarUrl?: string | null;
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
};

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department?: string;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
};

export type CreateUserPayload = {
  fullName: string;
  email: string;
  password: string;
  roleId: number;
  department?: string;
};

export type UpdateProfilePayload = {
  fullName: string;
  department?: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ForgotPasswordResponse = {
  message: string;
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type Role = "Admin" | "Agent" | "Manager" | "Employee";

export type ApiError = {
  message: string;
  status: number;
};

export type Ticket = {
  id: string;
  referenceNumber: string;
  title: string;
  description: string;
  categoryId: number;
  categoryName: string;
  priorityId: number;
  priorityName: string;
  statusId: number;
  statusName: string;
  createdBy: string;
  createdByName: string;
  createdByAvatarUrl?: string | null;
  assignedTo?: string | null;
  assignedToName?: string | null;
  assignedToAvatarUrl?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type TicketCreatePayload = {
  title: string;
  description: string;
  categoryId: number;
  priorityId: number;
};

export type TicketUpdatePayload = {
  title: string;
  description: string;
  categoryId: number;
  priorityId: number;
};

export type Comment = {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  body: string;
  isInternal: boolean;
  createdAt: string;
};

export type AddCommentPayload = {
  body: string;
  isInternal: boolean;
};

export type StatusHistoryEntry = {
  id: string;
  ticketId: string;
  changedBy: string;
  changedByName: string;
  changedByAvatarUrl?: string | null;
  oldStatusId: number;
  oldStatusName: string;
  newStatusId: number;
  newStatusName: string;
  changedAt: string;
  notes: string;
};

export type AssignmentHistoryEntry = {
  id: string;
  ticketId: string;
  assignedBy: string;
  assignedByName: string;
  assignedByAvatarUrl?: string | null;
  assignedTo?: string | null;
  assignedToName?: string | null;
  assignedToAvatarUrl?: string | null;
  assignedAt: string;
};

export type ActivityLogEntry = {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata: string;
  performedAt: string;
};

export type Category = {
  id: number;
  name: string;
  description?: string | null;
};

export type Priority = {
  id: number;
  name: string;
  level: number;
};

export type Status = {
  id: number;
  name: string;
};

// Dashboard
export type DashboardStats = {
  totalCreated: number;
  openCount: number;
  resolvedCount: number;
  totalAssigned: number;
  inProgressCount: number;
  totalTickets: number;
  closedCount: number;
  cancelledCount: number;
  unassignedCount: number;
  createdTodayCount: number;
};

export type ChartDataPoint = {
  label: string;
  count: number;
};

export type PriorityCount = {
  priorityName: string;
  level: number;
  count: number;
};

export type AgentPerformance = {
  agentId: string;
  agentName: string;
  assignedCount: number;
  resolvedCount: number;
  avgResolutionHours: number;
};

export type TicketsOverTimeEntry = {
  date: string;
  created: number;
  resolved: number;
};

// Notifications
export type Notification = {
  id: string;
  userId: string;
  ticketId?: string | null;
  ticketReferenceNumber?: string | null;
  ticketTitle?: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type UnreadCount = {
  count: number;
};

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

// AI
export type SuggestCategoryResponse = {
  categoryId: number;
  categoryName: string;
  confidence: number;
  reasoning: string;
};

export type SuggestPriorityResponse = {
  priorityId: number;
  priorityName: string;
  confidence: number;
  reasoning: string;
};

export type SuggestReplyResponse = {
  suggestedBody: string;
  reasoning: string;
};

export type ScanAttachmentResponse = {
  summary: string;
  detectedIssues: string[];
};

// Attachments
export type Attachment = {
  id: string;
  ticketId: string;
  uploadedBy: string;
  uploaderName: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  downloadUrl: string;
  previewUrl?: string | null;
  aiSummary?: string | null;
  aiSummaryGeneratedAt?: string | null;
};
