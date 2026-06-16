import { HubConnectionBuilder, HubConnection, LogLevel } from "@microsoft/signalr";
import { getToken } from "@/lib/auth";

let connection: HubConnection | null = null;

type NotificationCallback = (notification: {
  id: string;
  userId: string;
  ticketId?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}) => void;

type UnreadCountCallback = (data: { count: number }) => void;

let onNotification: NotificationCallback | null = null;
let onUnreadCount: UnreadCountCallback | null = null;

export async function startSignalRConnection(): Promise<void> {
  if (connection?.state === "Connected") return;

  const token = getToken();
  if (!token) return;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055";

  connection = new HubConnectionBuilder()
    .withUrl(`${baseUrl.replace("/api", "")}/hubs/notifications`, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  connection.on("ReceiveNotification", (data) => {
    onNotification?.(data);
  });

  connection.on("UnreadCount", (data) => {
    onUnreadCount?.(data);
  });

  try {
    await connection.start();
  } catch {
    // Connection failed - will retry automatically
  }
}

export function stopSignalRConnection(): void {
  if (connection) {
    connection.stop();
    connection = null;
  }
}

export function setOnNotification(callback: NotificationCallback | null): void {
  onNotification = callback;
}

export function setOnUnreadCount(callback: UnreadCountCallback | null): void {
  onUnreadCount = callback;
}
