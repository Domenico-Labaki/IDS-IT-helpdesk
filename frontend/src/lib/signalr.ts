import { HubConnectionBuilder, HubConnection, LogLevel } from "@microsoft/signalr";
import { getToken } from "@/lib/auth";

let connection: HubConnection | null = null;
let connectionCount = 0;
let initialStartResolved = false;
let starting = false;

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
  connectionCount++;

  if (connectionCount > 1 || starting) return;
  if (connection?.state === "Connected") return;

  const token = getToken();
  if (!token) {
    connectionCount--;
    return;
  }

  starting = true;

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055").replace(/\/api\/?$/, "");

  connection = new HubConnectionBuilder()
    .withUrl(`${baseUrl}/hubs/notifications`, {
      accessTokenFactory: () => getToken() ?? "",
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.None)
    .build();

  connection.on("ReceiveNotification", (data) => {
    onNotification?.(data);
  });

  connection.on("UnreadCount", (data) => {
    onUnreadCount?.(data);
  });

  try {
    await connection.start();
    initialStartResolved = true;
  } catch {
    connectionCount = 0;
    connection = null;
  } finally {
    starting = false;
  }
}

export function stopSignalRConnection(): void {
  if (connectionCount === 0) return;
  connectionCount--;

  if (connectionCount > 0) return;
  if (!initialStartResolved) return;

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
