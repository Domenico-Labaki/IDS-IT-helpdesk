export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function getAvatarSrc(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055/api";
  const origin = apiBase.replace(/\/api\/?$/, "");
  return `${origin}${url}`;
}
