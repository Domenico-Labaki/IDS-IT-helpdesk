const actionLabels: Record<string, string> = {
  COMMENT_ADDED: "commented",
  ATTACHMENT_UPLOADED: "uploaded an attachment",
  ATTACHMENT_DELETED: "deleted an attachment",
  TicketCreated: "created this ticket",
  TicketUpdated: "updated this ticket",
  TicketDeleted: "deleted this ticket",
  STATUS_CHANGED: "changed the status",
  TICKET_ASSIGNED: "assigned this ticket",
  TICKET_UNASSIGNED: "unassigned this ticket",
  TICKET_AUTO_ASSIGNED: "was auto-assigned",
  TICKET_ESCALATED: "escalated this ticket",
  ProfileUpdated: "updated their profile",
  AvatarUpdated: "updated their avatar",
  Created: "created",
  Updated: "updated",
  Deleted: "deleted",
  Assigned: "assigned",
  Unassigned: "unassigned",
};

export function formatAction(action: string): string {
  return actionLabels[action] ?? action;
}
